import { z } from "zod";
import { ORDER_TYPES, PAYMENT_METHODS } from "./order.constant";
import { indianMobileSchema } from "../../utils/validation/indian-fields";

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid ID format");

const paymentMethodSchema = z
  .string()
  .transform((value) => (value === "online" ? "upi" : value))
  .pipe(z.enum(PAYMENT_METHODS));

const deliveryAddressSchema = z.object({
  hostelName: z.string().max(100).optional(),
  roomNumber: z.string().max(50).optional(),
  landmark: z.string().max(200).optional(),
  contactNumber: indianMobileSchema,
  fullAddress: z.string().min(5).max(500),
});

const orderItemSchema = z.object({
  menuItemId: objectIdSchema,
  quantity: z.number().int().min(1).max(50),
  specialInstructions: z.string().max(200).optional(),
});

const requireDeliveryAddress = (
  data: { orderType: (typeof ORDER_TYPES)[number]; deliveryAddress?: z.infer<typeof deliveryAddressSchema> },
  ctx: z.RefinementCtx,
) => {
  if (data.orderType === "delivery" && !data.deliveryAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Delivery address is required for delivery orders",
      path: ["deliveryAddress"],
    });
  }
};

export const createOrderSchema = z.object({
  body: z
    .object({
      cafeId: objectIdSchema,
      items: z
        .array(orderItemSchema)
        .min(1, "Order must contain at least one item"),
      paymentMethod: paymentMethodSchema,
      orderType: z.enum(ORDER_TYPES).default("pickup"),
      notes: z.string().max(500).optional(),
      deliveryAddress: deliveryAddressSchema.optional(),
    })
    .superRefine(requireDeliveryAddress),
});

export const createOrderFromCartSchema = z.object({
  body: z
    .object({
      paymentMethod: paymentMethodSchema,
      orderType: z.enum(ORDER_TYPES).default("pickup"),
      notes: z.string().max(500).optional(),
      deliveryAddress: deliveryAddressSchema.optional(),
    })
    .superRefine(requireDeliveryAddress),
});

export const getMyOrdersSchema = z.object({
  query: z.object({
    active: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => val === "true"),
    history: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => val === "true"),
    orderType: z.enum(ORDER_TYPES).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
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
