import { z } from "zod";

export const upsertSupplierProfileSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  businessType: z.string().min(2, "Business type is required"),
  contactInfo: z.string().min(5, "Contact info is required"),
  address: z.string().min(5, "Address is required"),
  operatingHours: z.string().min(2, "Operating hours are required"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  fabricTypes: z.array(z.string()).min(1, "Select at least one fabric type"),
  moq: z.number().int().positive("MOQ must be a positive number"),
  additionalInfo: z.record(z.any()).optional(),
});

export type UpsertSupplierProfileInput = z.infer<typeof upsertSupplierProfileSchema>;
