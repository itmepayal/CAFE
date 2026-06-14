import { z } from "zod";

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
 * CREATE MENU ITEM
 * =========================================================
 */
export const createMenuItemSchema = z.object({
  body: z
    .object({
      cafeId: objectIdSchema,
      category: z.string().trim().min(2).max(100),
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
 * SEARCH MENU QUERY
 * =========================================================
 */
export const searchMenuQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    isVeg: z.enum(["true", "false"]).optional(),
    isAvailable: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
});
