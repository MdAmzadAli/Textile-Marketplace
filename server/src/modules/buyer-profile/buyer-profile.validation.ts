import { z } from "zod";

export const upsertBuyerProfileSchema = z.object({
  businessType: z.string().min(2, "Business type is required"),
  industry: z.string().min(2, "Industry is required"),
  categoriesOfInterest: z.array(z.string()).min(1, "Select at least one category"),
  fabricPreferences: z.array(z.string()).min(1, "Select at least one fabric preference"),
  typicalOrderQty: z.number().int().positive("Typical order quantity must be positive"),
  budgetRange: z.string().min(1, "Budget range is required"),
  additionalPrefs: z.record(z.any()).optional(),
});

export type UpsertBuyerProfileInput = z.infer<typeof upsertBuyerProfileSchema>;
