import { describe, expect, it } from "vitest";
import {
  adminEmailLoginSchema,
  adminEmailRegisterSchema,
  cafeOwnerLoginSchema,
} from "../src/modules/auth/auth.validation";

describe("auth.validation", () => {
  it("requires email and password for admin login", () => {
    const result = adminEmailLoginSchema.safeParse({
      body: { email: "admin@test.com" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid admin email login", () => {
    const result = adminEmailLoginSchema.safeParse({
      body: {
        email: "admin@gravly.com",
        password: "password123",
      },
    });
    expect(result.success).toBe(true);
  });

  it("requires name email password for admin register", () => {
    const result = adminEmailRegisterSchema.safeParse({
      body: {
        email: "admin@gravly.com",
        password: "password123",
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid admin register payload", () => {
    const result = adminEmailRegisterSchema.safeParse({
      body: {
        name: "Admin",
        email: "admin@gravly.com",
        password: "password123",
        inviteToken: "bootstrap-token",
      },
    });
    expect(result.success).toBe(true);
  });

  it("requires google token for cafe owner login", () => {
    const result = cafeOwnerLoginSchema.safeParse({
      body: { provider: "google" },
    });
    expect(result.success).toBe(false);
  });

  it("requires apple identity token for cafe owner login", () => {
    const result = cafeOwnerLoginSchema.safeParse({
      body: { provider: "apple" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid apple cafe owner login", () => {
    const result = cafeOwnerLoginSchema.safeParse({
      body: {
        provider: "apple",
        identityToken: "apple-token-123",
      },
    });
    expect(result.success).toBe(true);
  });
});
