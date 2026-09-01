import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ID format");

export const addToCartSchema = z.object({
  body: z.object({
    menuItemId: objectIdSchema,
    quantity: z.number().int().min(1).max(50),
    specialInstructions: z.string().max(200).optional(),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    cartItemId: objectIdSchema,
  }),
  body: z.object({
    quantity: z.number().int().min(1).max(50),
  }),
});

export const cartItemParamSchema = z.object({
  params: z.object({
    cartItemId: objectIdSchema,
  }),
});
