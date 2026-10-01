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

const emptyOr = <T extends z.ZodTypeAny>(schema: T) =>
  schema.optional().or(z.literal(""));

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.coerce.number().min(min).max(max).optional(),
  );

const aadharNumberSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{12}$/, "Invalid Aadhar number");
const panNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN number");
const fssaiNumberSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{14}$/, "Invalid FSSAI number");
const upiIdSchema = z
  .string()
  .trim()
  .regex(/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/, "Invalid UPI ID");

export const registerCafeSchema = z.object({
  body: z
    .object({
      cafeName: z.string().trim().min(3).max(150),
      ownerName: z.string().trim().min(2).max(100),
      description: z.string().trim().max(1000).optional(),
      mobile: mobileSchema,
      email: z
        .string()
        .trim()
        .email("Invalid email")
        .optional()
        .or(z.literal("")),

      // address
      searchLocation: z.string().trim().max(300).optional(),
      street: z.string().trim().max(200).optional(),
      area: z.string().trim().max(100).optional(),
      city: z.string().trim().max(100).optional(),
      state: z.string().trim().max(100).optional(),
      pincode: pincodeSchema.optional(),
      landmark: z.string().trim().max(200).optional(),

      // location
      latitude: optionalNumber(-90, 90),
      longitude: optionalNumber(-180, 180),

      supportsDelivery: z.enum(["true", "false"]).optional(),

      // documents (all optional)
      aadharNumber: emptyOr(aadharNumberSchema),
      panNumber: emptyOr(panNumberSchema),
      fssaiNumber: emptyOr(fssaiNumberSchema),

      // bank
      gstId: gstIdSchema,
      accountHolderName: z.string().trim().min(2).max(100),
      accountNumber: accountNumberSchema,
      confirmAccountNumber: accountNumberSchema,
      bankName: bankNameSchema.optional(),
      ifscCode: ifscSchema,
      upiId: emptyOr(upiIdSchema),

      // social media (all optional)
      instagram: emptyOr(z.string().trim().url("Invalid Instagram URL").max(200)),
      facebook: emptyOr(z.string().trim().url("Invalid Facebook URL").max(200)),
      website: emptyOr(z.string().trim().url("Invalid website URL").max(200)),
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

export const REGISTRATION_MIN_LAYOUT_PHOTOS = 2;

export type FigmaRegistrationMedia = {
  cafeImage?: string;
  layoutPhotos?: string[];
  fssaiCertificate?: string;
  bankPassbookPhoto?: string;
};

export const collectFigmaRegistrationMediaErrors = (
  media: FigmaRegistrationMedia,
): string[] => {
  const errors: string[] = [];

  if (!media.cafeImage) {
    errors.push("Step 4: Owner/Cafe owner photo is required");
  }

  const layoutCount = media.layoutPhotos?.length ?? 0;
  if (layoutCount < REGISTRATION_MIN_LAYOUT_PHOTOS) {
    errors.push(
      `Step 4: Upload at least ${REGISTRATION_MIN_LAYOUT_PHOTOS} layout/cafe photos`,
    );
  }

  if (!media.fssaiCertificate) {
    errors.push("Step 5: Shop establishment certificate is required");
  }

  if (!media.bankPassbookPhoto) {
    errors.push("Step 5: Bank passbook / cancelled cheque photo is required");
  }

  return errors;
};
