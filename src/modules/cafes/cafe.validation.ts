import { z } from "zod";

/**
 * =========================================================
 * REGISTER CAFE
 * =========================================================
 */
export const registerCafeSchema = z.object({
  body: z.object({
    cafeName: z.string().trim().min(3).max(150),
    ownerName: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000).optional(),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
    email: z.string().email("Invalid email").optional(),

    street: z.string().trim().max(200).optional(),
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
      .regex(/^[2-9][0-9]{11}$/, "Invalid Aadhaar number"),
    panNumber: z
      .string()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN number"),
    fssaiNumber: z.string().regex(/^[0-9]{14}$/, "Invalid FSSAI number"),

    accountHolderName: z.string().trim().min(2).max(100),
    accountNumber: z.string().regex(/^[0-9]{9,18}$/, "Invalid account number"),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
    upiId: z.string().regex(/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/, "Invalid UPI ID"),
  }),
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
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Invalid mobile number")
      .optional(),
    email: z.string().email("Invalid email").optional(),
    street: z.string().trim().max(200).optional(),
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
    ifscCode: z
      .string()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code")
      .optional(),
    upiId: z
      .string()
      .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/, "Invalid UPI ID")
      .optional(),
  }),
});

/**
 * =========================================================
 * ADMIN APPROVE / REJECT
 * =========================================================
 */
export const updateCafeStatusSchema = z.object({
  body: z.object({
    status: z.enum(["approved", "rejected"]),
    adminNote: z.string().max(500).optional(),
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
