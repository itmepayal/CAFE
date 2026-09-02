import { z } from "zod";

const mobileSchema = z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number");
const pincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, "Invalid pincode");
const aadharSchema = z
  .string()
  .regex(/^[2-9][0-9]{11}$/, "Invalid Aadhaar number");
const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN number");
const fssaiSchema = z.string().regex(/^[0-9]{14}$/, "Invalid FSSAI number");
const accountNumberSchema = z
  .string()
  .regex(/^[0-9]{9,18}$/, "Invalid account number");
const ifscSchema = z
  .string()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code");
const upiSchema = z
  .string()
  .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/, "Invalid UPI ID");
const bankNameSchema = z.string().trim().min(2).max(100);
const gstIdSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    "Invalid GST ID",
  )
  .optional()
  .or(z.literal(""));

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
    mobile: mobileSchema,
    email: z.string().email("Invalid email").optional(),

    street: z.string().trim().max(200).optional(),
    area: z.string().trim().max(100).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    pincode: pincodeSchema.optional(),
    landmark: z.string().trim().max(200).optional(),

    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),

    aadharNumber: aadharSchema,
    panNumber: panSchema,
    fssaiNumber: fssaiSchema,

    accountHolderName: z.string().trim().min(2).max(100),
    accountNumber: accountNumberSchema,
    confirmAccountNumber: accountNumberSchema.optional(),
    bankName: bankNameSchema,
    gstId: gstIdSchema,
    ifscCode: ifscSchema,
    upiId: upiSchema,
    registrationFeedback: z.string().trim().max(1000).optional(),
    instagram: z.string().trim().max(200).optional(),
    facebook: z.string().trim().max(200).optional(),
    website: z.string().trim().url().optional().or(z.literal("")),
  }).superRefine((data, ctx) => {
    if (
      data.confirmAccountNumber &&
      data.confirmAccountNumber !== data.accountNumber
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Account numbers do not match",
        path: ["confirmAccountNumber"],
      });
    }
  }),
});

/**
 * =========================================================
 * REGISTRATION DRAFT — PER STEP
 * =========================================================
 */
export const draftStepParamsSchema = z.object({
  params: z.object({
    step: z.coerce.number().int().min(1).max(5),
  }),
});

export const saveDraftStep1Schema = z.object({
  body: z.object({
    cafeName: z.string().trim().min(3).max(150),
    ownerName: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000).optional(),
    mobile: mobileSchema,
    email: z.string().email("Invalid email").optional(),
  }),
});

export const saveDraftStep2Schema = z.object({
  body: z.object({
    street: z.string().trim().max(200).optional(),
    area: z.string().trim().max(100).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    pincode: pincodeSchema.optional(),
    landmark: z.string().trim().max(200).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  }),
});

export const saveDraftStep3Schema = z.object({
  body: z.object({
    accountHolderName: z.string().trim().min(2).max(100),
    accountNumber: accountNumberSchema,
    confirmAccountNumber: accountNumberSchema,
    bankName: bankNameSchema,
    gstId: gstIdSchema,
    ifscCode: ifscSchema,
    upiId: upiSchema,
  }).refine((data) => data.accountNumber === data.confirmAccountNumber, {
    message: "Account numbers do not match",
    path: ["confirmAccountNumber"],
  }),
});

export const saveDraftStep4Schema = z.object({
  body: z.object({
    aadharNumber: aadharSchema,
    panNumber: panSchema,
    fssaiNumber: fssaiSchema,
  }),
});

export const saveDraftStep5Schema = z.object({
  body: z.object({
    registrationFeedback: z.string().trim().max(1000).optional(),
    instagram: z.string().trim().max(200).optional(),
    facebook: z.string().trim().max(200).optional(),
    website: z.string().trim().url().optional().or(z.literal("")),
  }),
});

export const submitDraftSchema = z.object({
  body: z.object({}).optional(),
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
