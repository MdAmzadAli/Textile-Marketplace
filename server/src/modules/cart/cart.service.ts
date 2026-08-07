import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { AddCartItemInput, MergeGuestCartInput, UpdateCartItemInput } from "./cart.validation";

const CART_ITEM_INCLUDE = {
  items: {
    include: { product: { include: { supplier: true, category: true } } },
  },
} as const;

async function getOrCreateCart(buyerId: string) {
  return prisma.cart.upsert({
    where: { buyerId },
    update: {},
    create: { buyerId },
    include: CART_ITEM_INCLUDE,
  });
}

export async function getOwnCart(buyerId: string) {
  return getOrCreateCart(buyerId);
}

export async function addItem(buyerId: string, input: AddCartItemInput) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
  if (product.supplierId === buyerId) {
    throw new AppError(400, "OWN_PRODUCT", "You cannot add your own listing to the cart");
  }
  if (product.status !== "active") {
    throw new AppError(400, "PRODUCT_UNAVAILABLE", "This product is not currently available");
  }
  if ((product.colors.length > 0 && !input.selectedColor) || (input.selectedColor && !product.colors.includes(input.selectedColor))) throw new AppError(400, "INVALID_COLOR", "Choose an available product color");

  const cart = await prisma.cart.upsert({
    where: { buyerId },
    update: {},
    create: { buyerId },
  });

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId_selectedColor: { cartId: cart.id, productId: input.productId, selectedColor: input.selectedColor } },
  });

  const nextQuantity = (existing?.quantity ?? 0) + input.quantity;
  if (nextQuantity < product.moq) {
    throw new AppError(400, "MOQ_NOT_MET", `Minimum order quantity for ${product.name} is ${product.moq}`);
  }
  if (nextQuantity > product.stock) {
    throw new AppError(400, "INSUFFICIENT_STOCK", `Only ${product.stock} units available`);
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId_selectedColor: { cartId: cart.id, productId: input.productId, selectedColor: input.selectedColor } },
    update: { quantity: nextQuantity },
    create: { cartId: cart.id, productId: input.productId, quantity: input.quantity, selectedColor: input.selectedColor },
  });

  return getOrCreateCart(buyerId);
}

export async function mergeGuestCart(buyerId: string, input: MergeGuestCartInput) {
  await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.upsert({ where: { buyerId }, update: {}, create: { buyerId } });
    for (const line of input.items) {
      const product = await tx.product.findUnique({ where: { id: line.productId } });
      if (!product || product.status !== "active") throw new AppError(400, "PRODUCT_UNAVAILABLE", "A product in your cart is no longer available");
      if (product.supplierId === buyerId) throw new AppError(400, "OWN_PRODUCT", "You cannot add your own listing to the cart");
      if ((product.colors.length > 0 && !line.selectedColor) || (line.selectedColor && !product.colors.includes(line.selectedColor))) throw new AppError(400, "INVALID_COLOR", "Choose an available product color");
      const existing = await tx.cartItem.findUnique({ where: { cartId_productId_selectedColor: { cartId: cart.id, productId: line.productId, selectedColor: line.selectedColor } } });
      const quantity = (existing?.quantity ?? 0) + line.quantity;
      if (quantity < product.moq) throw new AppError(400, "MOQ_NOT_MET", `Minimum order quantity for ${product.name} is ${product.moq}`);
      if (quantity > product.stock) throw new AppError(400, "INSUFFICIENT_STOCK", `Only ${product.stock} units of ${product.name} are available`);
      await tx.cartItem.upsert({ where: { cartId_productId_selectedColor: { cartId: cart.id, productId: line.productId, selectedColor: line.selectedColor } }, update: { quantity }, create: { cartId: cart.id, productId: line.productId, quantity: line.quantity, selectedColor: line.selectedColor } });
    }
  });
  return getOrCreateCart(buyerId);
}

export async function updateItem(buyerId: string, itemId: string, input: UpdateCartItemInput) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true },
  });
  if (!item || item.cart.buyerId !== buyerId) {
    throw new AppError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
  }
  if (input.quantity > item.product.stock) {
    throw new AppError(400, "INSUFFICIENT_STOCK", `Only ${item.product.stock} units available`);
  }
  if (input.quantity < item.product.moq) {
    throw new AppError(400, "MOQ_NOT_MET", `Minimum order quantity for ${item.product.name} is ${item.product.moq}`);
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: input.quantity } });
  return getOrCreateCart(buyerId);
}

export async function removeItem(buyerId: string, itemId: string) {
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.buyerId !== buyerId) {
    throw new AppError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
  }

  await prisma.cartItem.delete({ where: { id: itemId } });
  return getOrCreateCart(buyerId);
}
