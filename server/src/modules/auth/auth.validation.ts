import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // New accounts always begin as buyers. Seller access is granted only by
  // the authenticated buyer -> activate-seller flow.
  role: z.literal("buyer").default("buyer"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const sellerActivationSchema = z.object({ password: z.string().min(1).optional() });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
