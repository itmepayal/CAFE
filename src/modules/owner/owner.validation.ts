import { z } from "zod";
import {
  indianMobileSchema,
  ifscSchema,
  DEFAULT_ORDER_REJECT_REASON,
} from "../../utils/validation/indian-fields";

/**
 * =========================================================
 * COMMON ENUMS
 * =========================================================
 */

const categoryEnum = z.enum([
  "food_quality",
  "wrong_item",
  "late_order",
  "refund_issue",
  "payment_issue",
  "cafe_behavior",
  "technical_issue",
  "other",
]);
const statusEnum = z.enum([
  "open",
  "in_review",
  "resolved",
  "rejected",
  "closed",
]);

/**
 * =========================================================
 * COMMON SCHEMAS
 * =========================================================
 */
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const nutritionalInfoSchema = z.object({
  calories: z.coerce.number().min(0).optional(),
  protein: z.coerce.number().min(0).optional(),
  carbs: z.coerce.number().min(0).optional(),
  fat: z.coerce.number().min(0).optional(),
});

/**
 * =========================================================
 * UPDATE CAFE
 * =========================================================
 */
export const updateCafeSchema = z.object({
  body: z.object({
    cafeName: z.string().trim().min(3).max(150).optional(),
    ownerName: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(1000).optional(),
    mobile: indianMobileSchema.optional(),
    email: z.string().email("Invalid email").optional(),
    street: z.string().trim().max(200).optional(),
    searchLocation: z.string().trim().max(300).optional(),
    area: z.string().trim().max(100).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    pincode: z
      .string()
      .regex(/^[1-9][0-9]{5}$/, "Invalid pincode")
      .optional(),

    landmark: z.string().trim().max(200).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),

    aadharNumber: z
      .string()
      .regex(/^[2-9][0-9]{11}$/, "Invalid Aadhaar number")
      .optional(),
    panNumber: z
      .string()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN number")
      .optional(),
    fssaiNumber: z
      .string()
      .regex(/^[0-9]{14}$/, "Invalid FSSAI number")
      .optional(),

    accountHolderName: z.string().trim().min(2).max(100).optional(),
    accountNumber: z
      .string()
      .regex(/^[0-9]{9,18}$/, "Invalid account number")
      .optional(),
    bankName: z.string().trim().min(2).max(100).optional(),
    ifscCode: ifscSchema.optional(),
    upiId: z
      .string()
      .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/, "Invalid UPI ID")
      .optional(),
  }),
});

/**
 * =========================================================
 * CREATE MENU ITEM
 * =========================================================
 */
export const createMenuItemSchema = z.object({
  body: z
    .object({
      category: z.string().trim().min(2).max(100).optional().default("General"),
      name: z.string().trim().min(2).max(100),
      description: z.string().trim().max(500).optional(),
      price: z.coerce.number().min(0),
      discountedPrice: z.coerce.number().min(0).nullable().optional(),
      preparationTime: z.coerce.number().min(1).max(180).default(10),
      isVeg: z.coerce.boolean().optional(),
      isPopular: z.coerce.boolean().optional(),
      isRecommended: z.coerce.boolean().optional(),
      isAvailable: z.coerce.boolean().optional(),
      stockQuantity: z.coerce.number().min(-1).optional(),
      tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
      nutritionalInfo: nutritionalInfoSchema.optional(),
      displayOrder: z.coerce.number().min(0).optional(),
    })
    .refine(
      (data) => !data.discountedPrice || data.discountedPrice < data.price,
      {
        message: "Discounted price must be less than price",
        path: ["discountedPrice"],
      },
    ),
});

/**
 * =========================================================
 * UPDATE MENU ITEM
 * =========================================================
 */
export const updateMenuItemSchema = z.object({
  body: z
    .object({
      category: z.string().trim().min(2).max(100).optional(),
      name: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().max(500).optional(),
      price: z.coerce.number().min(0).optional(),
      discountedPrice: z.coerce.number().min(0).nullable().optional(),
      preparationTime: z.coerce.number().min(1).max(180).optional(),
      isVeg: z.coerce.boolean().optional(),
      isPopular: z.coerce.boolean().optional(),
      isRecommended: z.coerce.boolean().optional(),
      isAvailable: z.coerce.boolean().optional(),
      stockQuantity: z.coerce.number().min(-1).optional(),
      tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
      nutritionalInfo: nutritionalInfoSchema.optional(),
      displayOrder: z.coerce.number().min(0).optional(),
    })
    .refine(
      (data) => {
        if (
          data.price !== undefined &&
          data.discountedPrice !== undefined &&
          data.discountedPrice !== null
        ) {
          return data.discountedPrice < data.price;
        }

        return true;
      },
      {
        message: "Discounted price must be less than price",
        path: ["discountedPrice"],
      },
    ),
});

/**
 * =========================================================
 * MENU ITEM PARAMS
 * =========================================================
 */
export const menuItemParamsSchema = z.object({
  params: z.object({
    itemId: objectIdSchema,
  }),
});

/**
 * =========================================================
 * CAFE MENU PARAMS
 * =========================================================
 */
export const cafeMenuParamsSchema = z.object({
  params: z.object({
    cafeId: objectIdSchema,
  }),
});

/**
 * =========================================================
 * TOGGLE AVAILABILITY
 * =========================================================
 */
export const toggleAvailabilitySchema = z.object({
  params: z.object({
    itemId: objectIdSchema,
  }),
});

/**
 * =========================================================
 * GET CAFES QUERY
 * =========================================================
 */
export const getCafeQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    city: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
});

/**
 * =========================================================
 * GET MY COMPLAINTS
 * =========================================================
 */

export const getMyComplaintsSchema = z.object({
  query: z.object({
    status: statusEnum.optional(),
    category: categoryEnum.optional(),

    page: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 1)),

    limit: z
      .string()
      .optional()
      .transform((val) => (val ? Number(val) : 10)),
  }),
});

/**
 * =========================================================
 * OWNER TRANSACTIONS
 * =========================================================
 */
export const getMyCafeOrdersSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    active: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => val === "true"),
    paymentStatus: z.string().optional(),
    deliveryStatus: z.string().optional(),
    search: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
});

export const getOwnerTransactionsSchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    settlementStatus: z.enum(["pending", "settled"]).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

export const orderIdParamsSchema = z.object({
  params: z.object({
    orderId: objectIdSchema,
  }),
});

export const acceptOrderSchema = z.object({
  params: z.object({ orderId: objectIdSchema }),
  body: z
    .object({
      estimatedReadyTime: z.string().datetime().optional(),
    })
    .optional(),
});

export const rejectOrderSchema = z.object({
  params: z.object({ orderId: objectIdSchema }),
  body: z
    .object({
      reason: z.string().trim().min(3).max(500).optional(),
    })
    .optional()
    .default({})
    .transform((body) => ({
      reason: body.reason?.trim() || DEFAULT_ORDER_REJECT_REASON,
    })),
});

export const completePickupOrderSchema = z.object({
  params: z.object({ orderId: objectIdSchema }),
  body: z.object({
    pickupCode: z.string().trim().min(4).max(20),
  }),
});
