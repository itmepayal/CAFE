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
const statusEnum = z.enum([
  "open",
  "in_review",
  "resolved",
  "rejected",
  "closed",
]);

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

/**
 * =========================================================
 * GET ALL COMPLAINTS
 * =========================================================
 */
export const getAllComplaintsSchema = z.object({
  query: z.object({
    status: statusEnum.optional(),
    category: categoryEnum.optional(),
    priority: priorityEnum.optional(),

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
 * ADMIN ACTION
 * =========================================================
 */
export const updateComplaintActionSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Complaint id is required"),
  }),

  body: z.object({
    status: statusEnum,
    adminNote: z.string().max(2000).optional(),
    resolution: z.string().max(2000).optional(),
    assignedTo: z.string().optional(),
  }),
});
