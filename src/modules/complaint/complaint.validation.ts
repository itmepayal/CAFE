import { z } from "zod";

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
const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);

/**
 * =========================================================
 * CREATE COMPLAINT
 * =========================================================
 */

export const createComplaintSchema = z.object({
  body: z.object({
    cafeId: z.string().optional(),
    orderId: z.string().optional(),

    category: categoryEnum.optional(),

    subject: z.string().trim().min(5).max(150),
    description: z.string().trim().min(10).max(2000),

    priority: priorityEnum.optional(),

    attachments: z
      .union([
        z.array(z.string()),
        z.string().transform((val) => JSON.parse(val)),
      ])
      .optional(),
  }),
});
