import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ORDER_STATUSES } from "../../config/constants";
import { ListOrdersQuery, PlaceOrderInput, SupplierStatsQuery } from "./orders.validation";

const ORDER_INCLUDE = {
  items: { include: { product: { include: { category: true, supplier: { select: { businessName: true, contactInfo: true } } } } } },
} as const;

/**
 * Places an order from the buyer's current cart.
 * Single DB transaction: validate stock -> create Order + OrderItems ->
 * decrement Product.stock -> clear CartItems. Any failure rolls back everything,
 * so no partial orders and no overselling under concurrent requests.
 */
export async function placeOrder(buyerId: string, input: PlaceOrderInput) {
  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({
      where: { buyerId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError(400, "CART_EMPTY", "Your cart is empty");
    }

    for (const item of cart.items) {
      if (item.product.supplierId === buyerId) {
        throw new AppError(400, "OWN_PRODUCT", "You cannot order your own listing");
      }
      if (item.product.status !== "active") {
        throw new AppError(
          400,
          "PRODUCT_UNAVAILABLE",
          `"${item.product.name}" is no longer available`
        );
      }
      if (item.quantity > item.product.stock) {
        throw new AppError(
          400,
          "INSUFFICIENT_STOCK",
          `Only ${item.product.stock} units of "${item.product.name}" available`
        );
      }
      if (item.quantity < item.product.moq) {
        throw new AppError(
          400,
          "MOQ_NOT_MET",
          `Minimum order quantity for "${item.product.name}" is ${item.product.moq}`
        );
      }
    }

    const order = await tx.order.create({
      data: {
        buyerId,
        shippingInfo: input.shippingInfo,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            supplierId: item.product.supplierId,
            quantity: item.quantity,
            priceAtOrder: item.product.price,
            selectedColor: item.selectedColor,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    await Promise.all(cart.items.map(async (item) => {
      const updated = await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.stock === 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { status: "out_of_stock" },
        });
      }
    }));

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  }, { maxWait: 10_000, timeout: 20_000 });
}

export async function getBuyerOrders(buyerId: string, query: ListOrdersQuery) {
  const { page, limit, status } = query;
  const where = { buyerId, ...(status && { status }) };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: ORDER_INCLUDE,
    }),
    prisma.order.count({ where }),
  ]);

  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getSupplierOrders(supplierId: string, query: ListOrdersQuery) {
  const { page, limit, status } = query;
  const where = { items: { some: { supplierId } }, ...(status && { status }) };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: { where: { supplierId }, include: { product: { include: { category: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { items: items.map(toSupplierOrder), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

type SellerLine = { quantity: number; priceAtOrder: unknown };
type ShippingSnapshot = {
  fullName?: string;
  countryCode?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  notes?: string;
};

/**
 * The one seller-subtotal calculation used by supplier order responses and stats.
 * It is deliberately based only on already supplier-filtered OrderItems.
 */
function calculateSellerTotal(items: SellerLine[]) {
  return items.reduce((total, item) => total + Number(item.priceAtOrder) * item.quantity, 0);
}

/** A supplier-visible order contains only that supplier's lines and derived revenue. */
function toSupplierOrder<T extends { shippingInfo: unknown; items: (SellerLine & Record<string, unknown>)[] }>(order: T) {
  const shippingInfo = order.shippingInfo as ShippingSnapshot;
  const items = order.items.map((item) => ({
    ...item,
    lineTotal: calculateSellerTotal([item]),
  }));

  return {
    ...order,
    items,
    sellerTotal: calculateSellerTotal(order.items),
    buyer: {
      name: shippingInfo.fullName ?? null,
      contact: shippingInfo.countryCode && shippingInfo.phone
        ? { phone: `${shippingInfo.countryCode ?? ""}${shippingInfo.phone}` }
        : null,
    },
    shippingAddress: {
      addressLine: shippingInfo.addressLine ?? null,
      city: shippingInfo.city ?? null,
      state: shippingInfo.state ?? null,
      postalCode: shippingInfo.postalCode ?? null,
      notes: shippingInfo.notes ?? null,
    },
  };
}

export async function getSupplierOrderById(supplierId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, items: { some: { supplierId } } },
    include: {
      items: { where: { supplierId }, include: { product: { include: { category: true } } } },
      _count: { select: { items: true } },
    },
  });
  if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  const { _count, ...supplierOrder } = order;
  return {
    ...toSupplierOrder(supplierOrder),
    // Only the boolean is exposed: never another supplier's item or revenue data.
    hasOtherSuppliers: _count.items > order.items.length,
  };
}

export async function getSupplierStats(supplierId: string, query: SupplierStatsQuery) {
  const { start, end } = statsRange(query);
  const items = await prisma.orderItem.findMany({
    where: { supplierId, order: { createdAt: { gte: start, lt: end } } },
    select: { orderId: true, quantity: true, priceAtOrder: true, order: { select: { createdAt: true } } },
  });
  const totalRevenue = calculateSellerTotal(items);
  const orderCount = new Set(items.map((item) => item.orderId)).size;
  const openOrderCount = await getSupplierOpenOrderCount(supplierId);
  const byDay = new Map<string, number>();
  for (let day = new Date(start); day < end; day.setUTCDate(day.getUTCDate() + 1)) byDay.set(day.toISOString().slice(0, 10), 0);
  for (const item of items) {
    const day = item.order.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + calculateSellerTotal([item]));
  }
  return {
    totalRevenue,
    orderCount,
    openOrderCount,
    averageOrderValue: orderCount ? totalRevenue / orderCount : 0,
    trend: [...byDay].map(([date, revenue]) => ({ date, revenue })),
  };
}

/** Count all seller-owned orders that remain actionable; it is never pagination- or range-bound. */
export async function getSupplierOpenOrderCount(supplierId: string) {
  return prisma.order.count({
    where: { status: { not: "completed" }, items: { some: { supplierId } } },
  });
}

function statsRange(query: SupplierStatsQuery) {
  const end = query.to ? endOfDay(query.to) : endOfDay(new Date());
  if (query.range === "custom") return { start: startOfDay(query.from!), end };
  const days = query.range === "today" ? 1 : query.range === "7d" ? 7 : 30;
  const start = startOfDay(new Date(end));
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { start, end };
}
function startOfDay(date: Date) { const value = new Date(date); value.setUTCHours(0, 0, 0, 0); return value; }
function endOfDay(date: Date) { const value = startOfDay(date); value.setUTCDate(value.getUTCDate() + 1); return value; }

export async function getOrderById(userId: string, role: "buyer" | "supplier", orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  const isOwner =
    role === "buyer"
      ? order.buyerId === userId
      : order.items.some((item) => item.supplierId === userId);

  if (!isOwner) {
    throw new AppError(403, "FORBIDDEN", "You do not have access to this order");
  }

  return role === "supplier" ? toSupplierOrder({ ...order, items: order.items.filter((item) => item.supplierId === userId) }) : order;
}

export async function advanceStatus(supplierId: string, orderId: string, nextStatus: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }
  if (!order.items.some((item) => item.supplierId === supplierId)) {
    throw new AppError(403, "FORBIDDEN", "You do not have items in this order");
  }

  const currentIndex = ORDER_STATUSES.indexOf(order.status);
  const nextIndex = ORDER_STATUSES.indexOf(nextStatus as (typeof ORDER_STATUSES)[number]);

  if (nextIndex !== currentIndex + 1) {
    throw new AppError(
      400,
      "INVALID_STATUS_TRANSITION",
      `Order cannot move from "${order.status}" to "${nextStatus}"`
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: nextStatus as (typeof ORDER_STATUSES)[number] },
    include: ORDER_INCLUDE,
  });
}
