import { z } from "zod";

const productFieldsSchema = z.object({
  name: z.string().min(2, "Name is required"),
  categoryId: z.string().uuid("Valid category is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  colors: z.array(z.string()).default([]),
  specs: z.record(z.any()).optional(),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  price: z.number().positive("Price must be positive"),
  moq: z.number().int().positive("MOQ must be positive"),
  unit: z.string().min(1).default("meter"),
  status: z.enum(["active", "out_of_stock", "inactive"]).default("active"),
});

export const createProductSchema = productFieldsSchema.superRefine((product, ctx) => {
  if (product.status === "active" && product.stock < product.moq) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["stock"], message: "Active listings need stock equal to or above their MOQ" });
  }
});

export const updateProductSchema = productFieldsSchema.partial();

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.string().uuid().optional(),
  // Category landing page listing (all leaves under a parent group).
  parentCategoryId: z.string().uuid().optional(),
  status: z.enum(["active", "out_of_stock", "inactive"]).optional(),
  search: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  colors: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional(),
  // Discovery quick-filter bar — "In stock only" pill.
  inStockOnly: z.coerce.boolean().optional(),
  // Category-page sidebar — max order quantity the buyer can commit to.
  // Arguably the highest-leverage B2B-specific filter: without it a small
  // buyer can match on every other facet and still hit a dead end at the
  // supplier's minimum order quantity.
  maxMoq: z.coerce.number().int().positive().optional(),
  // Facet filters from the quick-filter bar (one facet) and the category
  // sidebar (several facets at once, each itself multi-select — e.g.
  // Composition = Cotton OR Silk, AND Weave = Twill). Sent as a single
  // JSON-encoded map — { [specField]: string[] } — rather than dynamic
  // per-field query keys, so it validates as one typed field. Keys mirror
  // the JSON keys written in seed.ts.
  specs: z
    .string()
    .optional()
    .transform((raw, ctx) => {
      if (!raw) return undefined;
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "specs must be valid JSON" });
        return z.NEVER;
      }
      const result = z
        .record(
          z.enum(["composition", "weave", "finish", "material", "pattern", "sizeOrGauge"]),
          z.array(z.string()).min(1)
        )
        .safeParse(parsed);
      if (!result.success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid specs filter shape" });
        return z.NEVER;
      }
      return result.data;
    }),
  // Homepage "New Arrivals" / discovery sort control — name stays the default
  // so existing callers that never pass `sort` keep their current behavior.
  sort: z.enum(["newest", "price_asc", "price_desc", "name"]).default("name"),
});

export const trendingQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(8),
  // Optional — scopes "Trending" to a single leaf category landing page.
  categoryId: z.string().uuid().optional(),
  // Optional — scopes "Trending" to every leaf under a parent category
  // (e.g. the "Trims & Notions" landing page, which itself has no products).
  parentCategoryId: z.string().uuid().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
export type TrendingQuery = z.infer<typeof trendingQuerySchema>;
