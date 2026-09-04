import { z } from "zod";
import { DELIVERY_STATUSES } from "../order/order.constant";

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ID format");

export const getAvailableDeliveryOrdersSchema = z.object({
  query: z.object({
    cafeId: objectIdSchema.optional(),
    hostelName: z.string().trim().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

export const getMyDeliveriesSchema = z.object({
  query: z.object({
    active: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => val === "true"),
    history: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => val === "true"),
    deliveryStatus: z.enum(DELIVERY_STATUSES).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

export const deliveryOrderIdParamSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
});

export const updateDeliveryStatusSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(["out_for_delivery", "delivered"]),
  }),
});
