import { z } from "zod";
import { indianMobileSchema } from "../../utils/validation/indian-fields";
import { serverConfig } from "../../config";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: indianMobileSchema.optional(),
    university: z.string().min(2).max(150).optional(),
    hostel: z.string().min(2).max(100).optional(),
  }).strict(),
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
  if (data.provider === "google" && !data.token && !data.identityToken) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Google identityToken (or legacy token) is required",
      path: ["identityToken"],
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
    inviteToken: z.string().min(1).max(256).refine(
      (token) => /^[0-9]{8}$/.test(token) || token === serverConfig.ADMIN_BOOTSTRAP_TOKEN,
      "Invite token must be an 8-digit invite or the configured bootstrap token",
    ).optional(),
  }).strict(),
});

export const cafeOwnerLoginSchema = z.object({
  body: providerFieldsSchema.superRefine(validateProviderTokens),
});

/** @deprecated Use adminEmailLoginSchema for admin portal */
export const adminLoginSchema = z.object({
  body: providerFieldsSchema
    .extend({
      inviteToken: z.string().regex(/^[0-9]{8}$/, "Invite token must be exactly 8 digits").optional(),
    })
    .superRefine(validateProviderTokens),
});

export const createAdminInviteSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
  }),
});
