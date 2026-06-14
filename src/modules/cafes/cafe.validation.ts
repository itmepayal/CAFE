import { z } from "zod";

/**
 * =========================================================
 * COMMON SCHEMAS
 * =========================================================
 */

const addressSchema = z.object({
  street: z.string().trim().max(200).optional(),
  area: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Invalid pincode")
    .optional(),
  landmark: z.string().trim().max(200).optional(),
});

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const documentsSchema = z.object({
  aadharNumber: z
    .string()
    .regex(/^[2-9]{1}[0-9]{11}$/, "Invalid Aadhaar number"),
  aadharPhoto: z.string().optional(),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number"),
  panPhoto: z.string().optional(),
  fssaiNumber: z.string().regex(/^[0-9]{14}$/, "Invalid FSSAI number"),
  fssaiCertificate: z.string().optional(),
});

const bankDetailsSchema = z.object({
  accountHolderName: z.string().trim().min(2).max(100),
  accountNumber: z.string().regex(/^[0-9]{9,18}$/, "Invalid account number"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
  upiId: z.string().regex(/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/, "Invalid UPI ID"),
  bankPassbookPhoto: z.string().optional(),
});

/**
 * =========================================================
 * REGISTER CAFE
 * =========================================================
 */
export const registerCafeSchema = z.object({
  body: z.object({
    cafeName: z.string().trim().min(3).max(150),
    ownerName: z.string().trim().min(2).max(100),
    description: z.string().max(1000).optional(),
    mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"),
    email: z.string().email("Invalid email").optional(),
    address: addressSchema,
    location: locationSchema.optional(),
    documents: z
      .string()
      .transform((val) => JSON.parse(val))
      .pipe(documentsSchema),
    bankDetails: z
      .string()
      .transform((val) => JSON.parse(val))
      .pipe(bankDetailsSchema),
  }),
});

/**
 * =========================================================
 * UPDATE MY CAFE
 * =========================================================
 */
export const updateCafeSchema = z.object({
  body: z.object({
    cafeName: z.string().trim().min(3).max(150).optional(),
    ownerName: z.string().trim().min(2).max(100).optional(),
    description: z.string().max(1000).optional(),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Invalid mobile number")
      .optional(),
    email: z.string().email("Invalid email").optional(),
    address: z
      .string()
      .optional()
      .transform((val) => (val ? JSON.parse(val) : undefined))
      .pipe(addressSchema.optional()),
    location: z
      .string()
      .optional()
      .transform((val) => (val ? JSON.parse(val) : undefined))
      .pipe(locationSchema.optional()),
    bankDetails: z
      .string()
      .optional()
      .transform((val) => (val ? JSON.parse(val) : undefined))
      .pipe(bankDetailsSchema.partial().optional()),
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
