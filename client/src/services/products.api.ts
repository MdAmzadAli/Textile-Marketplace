import { api } from "./api";
import { PaginatedResult, Product, ProductStatus } from "../types";
import { SpecField } from "../utils/productTaxonomy";

export interface ListProductsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  parentCategoryId?: string;
  status?: ProductStatus;
  search?: string;
  supplierId?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  inStockOnly?: boolean;
  /** Max order quantity the buyer can commit to — server filters products.moq <= this. */
  maxMoq?: number;
  /** Several facets at once, each itself multi-select, e.g. { composition: ["100% Cotton", "100% Silk"] }. */
  specs?: Partial<Record<SpecField, string[]>>;
  sort?: "newest" | "price_asc" | "price_desc" | "name";
}

export async function listProducts(params: ListProductsParams = {}) {
  const { specs, ...rest } = params;
  const res = await api.get<{ data: PaginatedResult<Product> }>("/products", {
    params: {
      ...rest,
      // Sent as a single JSON-encoded param rather than dynamic per-field
      // query keys, so the server can validate the whole facet map as one
      // typed field (see products.validation.ts).
      specs: specs && Object.keys(specs).length ? JSON.stringify(specs) : undefined,
    },
  });
  return res.data.data;
}

// Homepage "Trending Now" / category landing "Trending in {category}" —
// ranked server-side by units ordered, not a fixed list.
export async function listTrendingProducts(
  limit = 8,
  opts: { categoryId?: string; parentCategoryId?: string } = {}
) {
  const res = await api.get<{ data: Product[] }>("/products/trending", { params: { limit, ...opts } });
  return res.data.data;
}

export async function getProduct(id: string) {
  const res = await api.get<{ data: Product }>(`/products/${id}`);
  return res.data.data;
}

export async function listOwnProducts() {
  const res = await api.get<{ data: Product[] }>("/products/mine");
  return res.data.data;
}

export type ProductInput = Omit<Product, "id" | "supplierId" | "category" | "supplier">;

export async function createProduct(input: ProductInput) {
  const res = await api.post<{ data: Product }>("/products", input);
  return res.data.data;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const res = await api.put<{ data: Product }>(`/products/${id}`, input);
  return res.data.data;
}

export async function deleteProduct(id: string) {
  await api.delete(`/products/${id}`);
}
