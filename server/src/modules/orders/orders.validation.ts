import { z } from "zod";
import { ORDER_STATUSES } from "../../config/constants";

export const placeOrderSchema = z.object({
  shippingInfo: z.object({
    fullName: z.string().trim().regex(/^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/, "Use letters only"),
    countryCode: z.string().regex(/^\+[1-9]\d{0,3}$/, "Choose a valid country code"),
    phone: z.string().regex(/^\d{6,14}$/, "Enter a valid phone number"),
    addressLine: z.string().trim().min(8, "Enter a complete street address").max(200),
    city: z.string().trim().regex(/^[A-Za-z][A-Za-z .'-]{1,49}$/, "Use letters only"),
    state: z.string().trim().regex(/^[A-Za-z][A-Za-z .'-]{1,49}$/, "Use letters only"),
    postalCode: z.string().trim().regex(/^[A-Za-z0-9 -]{3,12}$/, "Enter a valid postal code"),
    notes: z.string().trim().max(500).optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
});

export const supplierStatsQuerySchema = z.object({
  range: z.enum(["today", "7d", "30d", "custom"]).default("30d"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).superRefine((query, ctx) => {
  if (query.range === "custom" && (!query.from || !query.to)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Custom ranges require from and to dates" });
  }
  if (query.from && query.to && query.from > query.to) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "from must be before to" });
  }
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type SupplierStatsQuery = z.infer<typeof supplierStatsQuerySchema>;
