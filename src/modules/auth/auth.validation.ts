import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid phone number")
    .optional(),
  university: z.string().min(2).max(150).optional(),
  profileImage: z.string().url().optional(),
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

const providerLoginBodySchema = providerFieldsSchema.superRefine(
  validateProviderTokens,
);

export const adminLoginSchema = z.object({
  body: providerLoginBodySchema,
});

export const adminRegisterSchema = z.object({
  body: providerFieldsSchema
    .extend({
      inviteToken: z.string().min(1, "Admin invite token is required"),
    })
    .superRefine(validateProviderTokens),
});

export const createAdminInviteSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
  }),
});
