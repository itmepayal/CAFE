import { describe, expect, it } from "vitest";
import {
  adminEmailLoginSchema,
  adminEmailRegisterSchema,
  cafeOwnerLoginSchema,
  updateProfileSchema,
} from "../src/modules/auth/auth.validation";
import { serverConfig } from "../src/config";

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

  it("strips client-supplied role and identity fields from admin login input", () => {
    const result = adminEmailLoginSchema.safeParse({
      body: { email: "admin@gravly.com", password: "password123", role: "super_admin", userId: "attacker" },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.body).toEqual({ email: "admin@gravly.com", password: "password123" });
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
        inviteToken: "12345678",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts the configured bootstrap token even when it is not numeric", () => {
    serverConfig.ADMIN_BOOTSTRAP_TOKEN = "configured-bootstrap-token";
    const result = adminEmailRegisterSchema.safeParse({
      body: {
        name: "Admin",
        email: "admin@gravly.com",
        password: "password123",
        inviteToken: "configured-bootstrap-token",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects arbitrary role input during admin registration", () => {
    const result = adminEmailRegisterSchema.safeParse({
      body: {
        name: "Admin",
        email: "admin@gravly.com",
        password: "password123",
        inviteToken: "12345678",
        role: "super_admin",
      },
    });
    expect(result.success).toBe(false);
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

  it.each([
    "role", "email", "isEmailVerified", "providerId", "isBlocked", "isActive",
    "passwordHash", "ownedCafe", "deviceTokens", "lastLoginAt", "adminNote",
  ])("rejects protected field %s in profile update", (field) => {
    const result = updateProfileSchema.safeParse({ body: { name: "Valid Name", [field]: "attacker-value" } });
    expect(result.success).toBe(false);
  });

  it("accepts only allowlisted profile fields", () => {
    const result = updateProfileSchema.safeParse({
      body: { name: "Valid Name", phone: "9876543210", university: "University", hostel: "Hostel" },
    });
    expect(result.success).toBe(true);
  });
});
