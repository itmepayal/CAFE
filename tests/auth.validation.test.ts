import { describe, expect, it } from "vitest";
import { adminLoginSchema } from "../src/modules/auth/auth.validation";

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

  it("accepts admin login with google token", () => {
    const result = adminLoginSchema.safeParse({
      body: {
        provider: "google",
        token: "google-id-token",
      },
    });

    expect(result.success).toBe(true);
  });

  it("accepts admin login with apple token", () => {
    const result = adminLoginSchema.safeParse({
      body: {
        provider: "apple",
        identityToken: "apple-identity-token",
      },
    });

    expect(result.success).toBe(true);
  });
});
