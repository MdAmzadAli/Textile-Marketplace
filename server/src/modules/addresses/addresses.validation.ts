import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().trim().min(2).max(40),
  fullName: z.string().trim().regex(/^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/, "Use letters only"),
  countryCode: z.string().regex(/^\+[1-9]\d{0,3}$/),
  phone: z.string().regex(/^\d{6,14}$/),
  addressLine: z.string().trim().min(8).max(200),
  city: z.string().trim().regex(/^[A-Za-z][A-Za-z .'-]{1,49}$/),
  state: z.string().trim().regex(/^[A-Za-z][A-Za-z .'-]{1,49}$/),
  postalCode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit postal code"),
  notes: z.string().trim().max(500).optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;
