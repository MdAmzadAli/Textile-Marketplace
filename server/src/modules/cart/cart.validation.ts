import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().uuid("Valid product is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  selectedColor: z.string().trim().max(60).default(""),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive("Quantity must be positive"),
});

export const mergeGuestCartSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid("Valid product is required"),
    quantity: z.number().int().positive("Quantity must be positive"),
    selectedColor: z.string().trim().max(60).default(""),
  })).min(1, "Cart items are required"),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type MergeGuestCartInput = z.infer<typeof mergeGuestCartSchema>;
