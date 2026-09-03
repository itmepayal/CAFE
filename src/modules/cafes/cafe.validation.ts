import { z } from "zod";
import { indianMobileSchema, ifscSchema } from "../../utils/validation/indian-fields";

const mobileSchema = indianMobileSchema;
const pincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, "Invalid pincode");
const accountNumberSchema = z
  .string()
  .regex(/^[0-9]{9,18}$/, "Invalid account number");
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

/** Figma Step 1 — Cafe Details */
export const saveDraftStep1Schema = z.object({
  body: z.object({
    cafeName: z.string().trim().min(3).max(150),
    ownerName: z.string().trim().min(2).max(100),
    description: z.string().trim().max(1000).optional(),
    mobile: mobileSchema,
    email: z.string().email("Invalid email").optional(),
  }),
});

/** Figma Step 2 — Location Address */
export const saveDraftStep2Schema = z.object({
  body: z.object({
    searchLocation: z.string().trim().max(300).optional(),
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

/** Figma Step 3 — Financials (GST optional) */
export const saveDraftStep3Schema = z.object({
  body: z
    .object({
      gstId: gstIdSchema,
      accountHolderName: z.string().trim().min(2).max(100),
      accountNumber: accountNumberSchema,
      confirmAccountNumber: accountNumberSchema,
      bankName: bankNameSchema.optional(),
      ifscCode: ifscSchema,
    })
    .refine((data) => data.accountNumber === data.confirmAccountNumber, {
      message: "Account numbers do not match",
      path: ["confirmAccountNumber"],
    }),
});

/** Figma Step 4 — owner photo + layout/cafe photos (files in controller) */
export const saveDraftStep4Schema = z.object({
  body: z.object({}).optional(),
});

/** Figma Step 5 — shop establishment + bank passbook (files in controller) */
export const saveDraftStep5Schema = z.object({
  body: z.object({}).optional(),
});

export const draftStepParamsSchema = z.object({
  params: z.object({
    step: z.coerce.number().int().min(1).max(5),
  }),
});

export const submitDraftSchema = z.object({
  body: z.object({}).optional(),
});

export const registerCafeSchema = z.object({
  body: z
    .object({
      cafeName: z.string().trim().min(3).max(150),
      ownerName: z.string().trim().min(2).max(100),
      description: z.string().trim().max(1000).optional(),
      mobile: mobileSchema,
      email: z.string().email("Invalid email").optional(),
      searchLocation: z.string().trim().max(300).optional(),
      street: z.string().trim().max(200).optional(),
      area: z.string().trim().max(100).optional(),
      city: z.string().trim().max(100).optional(),
      state: z.string().trim().max(100).optional(),
      pincode: pincodeSchema.optional(),
      landmark: z.string().trim().max(200).optional(),
      gstId: gstIdSchema,
      accountHolderName: z.string().trim().min(2).max(100),
      accountNumber: accountNumberSchema,
      confirmAccountNumber: accountNumberSchema,
      bankName: bankNameSchema.optional(),
      ifscCode: ifscSchema,
    })
    .superRefine((data, ctx) => {
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

export const getCafeQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    city: z.string().optional(),
    isOpen: z
      .enum(["true", "false"])
      .optional()
      .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
});

/** Figma: min 2 layout/cafe photos on step 4 */
export const REGISTRATION_MIN_LAYOUT_PHOTOS = 2;

export type FigmaRegistrationMedia = {
  ownerPhoto?: string;
  layoutPhotos?: string[];
  shopEstablishmentCertificate?: string;
  bankPassbookPhoto?: string;
};

/** Shared validation for step 4–5 media (draft submit + single-shot register). */
export const collectFigmaRegistrationMediaErrors = (
  media: FigmaRegistrationMedia,
): string[] => {
  const errors: string[] = [];

  if (!media.ownerPhoto) {
    errors.push("Step 4: Owner/Cafe owner photo is required");
  }

  const layoutCount = media.layoutPhotos?.length ?? 0;
  if (layoutCount < REGISTRATION_MIN_LAYOUT_PHOTOS) {
    errors.push(
      `Step 4: Upload at least ${REGISTRATION_MIN_LAYOUT_PHOTOS} layout/cafe photos`,
    );
  }

  if (!media.shopEstablishmentCertificate) {
    errors.push("Step 5: Shop establishment certificate is required");
  }

  if (!media.bankPassbookPhoto) {
    errors.push("Step 5: Bank passbook / cancelled cheque photo is required");
  }

  return errors;
};
