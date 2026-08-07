import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { CreateProductInput, UpdateProductInput, ListProductsQuery } from "./products.validation";

const SORT_MAP: Record<ListProductsQuery["sort"], Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  name: { name: "asc" },
};

export async function listProducts(query: ListProductsQuery) {
  const {
    page,
    limit,
    categoryId,
    parentCategoryId,
    status,
    search,
    supplierId,
    minPrice,
    maxPrice,
    colors,
    inStockOnly,
    maxMoq,
    specs,
    sort,
  } = query;
  const normalizedSearch = search?.trim();

  const where: Prisma.ProductWhereInput = {
    ...(categoryId && { categoryId }),
    // Category landing pages (e.g. "Trims & Notions") have no products of
    // their own — only their leaf children do — so filter via the relation.
    ...(parentCategoryId && !categoryId && { category: { parentId: parentCategoryId } }),
    ...(status && { status }),
    ...(supplierId && { supplierId }),
    ...(colors?.length && { colors: { hasSome: colors } }),
    // Browsing should only surface products that can actually satisfy their
    // MOQ. A deliberate keyword search is the exception: buyers may still
    // need to find an unavailable listing and see its current state.
    ...(!normalizedSearch && { stock: { gte: prisma.product.fields.moq } }),
    ...(normalizedSearch && inStockOnly && { stock: { gt: 0 } }),
    ...(maxMoq !== undefined && { moq: { lte: maxMoq } }),
    // Several spec facets can apply at once (quick-filter bar sends one,
    // the category sidebar can send several — e.g. Composition AND Weave).
    // specs is a free-form JSON blob, so each facet is its own JSON-path
    // equality check; each facet is itself multi-select, so within one
    // facet the selected values are OR'd, and different facets are AND'd.
    ...(specs &&
      Object.keys(specs).length && {
        AND: Object.entries(specs).map(([field, values]) => ({
          OR: values.map((value) => ({ specs: { path: [field], equals: value } })),
        })),
      }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      price: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    }),
    ...(normalizedSearch && {
      OR: [
        { name: { contains: normalizedSearch, mode: "insensitive" } },
        { description: { contains: normalizedSearch, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: SORT_MAP[sort],
      include: { category: true, supplier: { select: { businessName: true, userId: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Homepage "Trending Now" — ranks active products by units ordered
 * (sum of OrderItem.quantity across all orders), not a hardcoded list.
 * Falls back to newest listings for products with no order history yet,
 * so the section is never empty on a fresh catalog.
 */
export async function getTrendingProducts(limit: number, categoryId?: string, parentCategoryId?: string) {
  const categoryFilter: Prisma.ProductWhereInput | undefined = categoryId
    ? { categoryId }
    : parentCategoryId
    ? { category: { parentId: parentCategoryId } }
    : undefined;

  const scopedIds = categoryFilter
    ? (await prisma.product.findMany({ where: categoryFilter, select: { id: true } })).map((p) => p.id)
    : undefined;

  if (scopedIds && scopedIds.length === 0) return [];

  const ranked = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: scopedIds ? { productId: { in: scopedIds } } : undefined,
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  const rankedIds = ranked.map((r) => r.productId);
  const rankedProducts = rankedIds.length
    ? await prisma.product.findMany({
        where: { id: { in: rankedIds }, status: "active", stock: { gte: prisma.product.fields.moq } },
        include: { category: true, supplier: { select: { businessName: true, userId: true } } },
      })
    : [];

  const byId = new Map(rankedProducts.map((p) => [p.id, p]));
  const items = rankedIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);

  if (items.length < limit) {
    const fill = await prisma.product.findMany({
      where: {
        status: "active",
        stock: { gte: prisma.product.fields.moq },
        id: { notIn: items.map((p) => p.id) },
        ...(scopedIds ? { id: { in: scopedIds } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit - items.length,
      include: { category: true, supplier: { select: { businessName: true, userId: true } } },
    });
    items.push(...fill);
  }

  return items;
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, supplier: { select: { businessName: true, userId: true } } },
  });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
  return product;
}

export async function createProduct(supplierId: string, input: CreateProductInput) {
  return prisma.product.create({
    data: { ...input, supplierId },
  });
}

export async function updateProduct(
  supplierId: string,
  productId: string,
  input: UpdateProductInput
) {
  const current = await assertOwnership(supplierId, productId);
  const stock = input.stock ?? current.stock;
  const moq = input.moq ?? current.moq;
  const status = input.status ?? current.status;
  if (status === "active" && stock < moq) {
    throw new AppError(400, "MOQ_EXCEEDS_STOCK", "Active listings need stock equal to or above their MOQ");
  }
  return prisma.product.update({ where: { id: productId }, data: input });
}

export async function deleteProduct(supplierId: string, productId: string) {
  await assertOwnership(supplierId, productId);
  await prisma.product.delete({ where: { id: productId } });
}

export async function listOwnProducts(supplierId: string) {
  return prisma.product.findMany({
    where: { supplierId },
    include: { category: true },
    orderBy: { name: "asc" },
  });
}

async function assertOwnership(supplierId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
  if (product.supplierId !== supplierId) {
    throw new AppError(403, "FORBIDDEN", "You do not own this product");
  }
  return product;
}
