import { z } from "zod";

export const updateEmailSchema = z.object({ email: z.string().trim().email("Enter a valid email address") });
export const updatePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8, "Password must be at least 8 characters") });
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
