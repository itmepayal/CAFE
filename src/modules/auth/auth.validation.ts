import { z } from "zod";
import { indianMobileSchema } from "../../utils/validation/indian-fields";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: indianMobileSchema.optional(),
    university: z.string().min(2).max(150).optional(),
    hostel: z.string().min(2).max(100).optional(),
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Google token is required"),
  }),
});

export const appleLoginSchema = z.object({
  body: z.object({
    identityToken: z.string().min(1, "Apple identity token is required"),
  }),
});

const providerFieldsSchema = z.object({
  provider: z.enum(["google", "apple"]),
  token: z.string().optional(),
  identityToken: z.string().optional(),
});

const validateProviderTokens = (
  data: z.infer<typeof providerFieldsSchema>,
  ctx: z.RefinementCtx,
): void => {
  if (data.provider === "google" && !data.token) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Google token is required when provider is google",
      path: ["token"],
    });
  }

  if (data.provider === "apple" && !data.identityToken) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Apple identity token is required when provider is apple",
      path: ["identityToken"],
    });
  }
};

export const adminEmailLoginSchema = z.object({
  body: z.object({
    email: z.string().email("Valid admin email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

export const adminEmailRegisterSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().email("Valid email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    inviteToken: z.string().min(1).optional(),
  }),
});

export const cafeOwnerLoginSchema = z.object({
  body: providerFieldsSchema.superRefine(validateProviderTokens),
});

/** @deprecated Use adminEmailLoginSchema for admin portal */
export const adminLoginSchema = z.object({
  body: providerFieldsSchema
    .extend({
      inviteToken: z.string().min(1).optional(),
    })
    .superRefine(validateProviderTokens),
});

export const createAdminInviteSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
  }),
});
