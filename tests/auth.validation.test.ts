import { describe, expect, it } from "vitest";
import {
  adminLoginSchema,
  adminRegisterSchema,
} from "../src/modules/auth/auth.validation";

describe("auth.validation", () => {
  it("requires google token when provider is google", () => {
    const result = adminLoginSchema.safeParse({
      body: {
        provider: "google",
      },
    });

    expect(result.success).toBe(false);
  });

  it("requires apple identity token when provider is apple", () => {
    const result = adminLoginSchema.safeParse({
      body: {
        provider: "apple",
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid google admin login payload", () => {
    const result = adminLoginSchema.safeParse({
      body: {
        provider: "google",
        token: "google-id-token",
      },
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid apple admin register payload with invite token", () => {
    const result = adminRegisterSchema.safeParse({
      body: {
        provider: "apple",
        identityToken: "apple-identity-token",
        inviteToken: "invite-token-123",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects admin register without invite token", () => {
    const result = adminRegisterSchema.safeParse({
      body: {
        provider: "google",
        token: "google-id-token",
      },
    });

    expect(result.success).toBe(false);
  });
});
