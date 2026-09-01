import { z } from "zod";
import { ORDER_TYPES, PAYMENT_METHODS } from "./order.constant";

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ID format");

const deliveryAddressSchema = z.object({
  hostelName: z.string().max(100).optional(),
  roomNumber: z.string().max(50).optional(),
  landmark: z.string().max(200).optional(),
  contactNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid contact number"),
  fullAddress: z.string().min(5).max(500),
});

const orderItemSchema = z.object({
  menuItemId: objectIdSchema,
  quantity: z.number().int().min(1).max(50),
  specialInstructions: z.string().max(200).optional(),
});

export const createOrderSchema = z.object({
  body: z
    .object({
      cafeId: objectIdSchema,
      items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
      paymentMethod: z.enum(PAYMENT_METHODS),
      orderType: z.enum(ORDER_TYPES).default("pickup"),
      notes: z.string().max(500).optional(),
      deliveryAddress: deliveryAddressSchema.optional(),
    })
    .superRefine((data, ctx) => {
      if (data.orderType === "delivery" && !data.deliveryAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Delivery address is required for delivery orders",
          path: ["deliveryAddress"],
        });
      }
    }),
});

export const cancelOrderSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
  body: z.object({
    reason: z.string().trim().min(1).max(500),
  }),
});

export const rateOrderSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
  body: z.object({
    stars: z.number().int().min(1).max(5),
    review: z.string().max(500).optional(),
  }),
});

export const orderNumberParamSchema = z.object({
  params: z.object({
    orderNumber: z.string().min(1).max(50),
  }),
});
