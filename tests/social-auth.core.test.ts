import { describe, expect, it, vi, beforeEach } from "vitest";
import { UnauthorizedError } from "../src/utils/errors/app.error";

vi.mock("../src/providers/google.provider", () => ({
  verifyGoogleToken: vi.fn(),
}));

vi.mock("../src/providers/apple.provider", () => ({
  verifyAppleToken: vi.fn(),
}));

vi.mock("../src/modules/auth/auth.repository", () => ({
  findUserByProviderIdOrEmail: vi.fn(),
  createGoogleUser: vi.fn(),
  createAppleUser: vi.fn(),
  createAdminGoogleUser: vi.fn(),
  createAdminAppleUser: vi.fn(),
  updateUserSession: vi.fn((user) => Promise.resolve(user)),
}));

vi.mock("../src/modules/auth/auth.tokens", () => ({
  issueAuthTokens: vi.fn(async (user) => ({
    user,
    accessToken: "access-token",
    refreshToken: "refresh-token",
  })),
}));

import { verifyGoogleToken } from "../src/providers/google.provider";
import {
  findUserByProviderIdOrEmail,
  createGoogleUser,
  createAdminGoogleUser,
} from "../src/modules/auth/auth.repository";
import {
  loginExistingUserWithProvider,
  loginWithProvider,
  loginAdminWithProvider,
  loginOrSignUpCafeOwnerWithProvider,
} from "../src/modules/auth/social-auth.core";

describe("social-auth.core", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loginWithProvider creates a student when user does not exist", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-sub-1",
      email: "student@example.com",
      name: "Student",
      profileImage: "",
      emailVerified: true,
    });

    vi.mocked(findUserByProviderIdOrEmail).mockResolvedValue(null);

    const createdUser = {
      _id: "user-1",
      email: "student@example.com",
      role: "student",
      isBlocked: false,
    } as any;

    vi.mocked(createGoogleUser).mockResolvedValue(createdUser);

    const result = await loginWithProvider("google", "valid-google-token");

    expect(createGoogleUser).toHaveBeenCalledOnce();
    expect(result.user.role).toBe("student");
    expect(result.accessToken).toBe("access-token");
  });

  it("loginExistingUserWithProvider does not create user when missing", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-sub-2",
      email: "admin@example.com",
      name: "Admin",
      profileImage: "",
      emailVerified: true,
    });

    vi.mocked(findUserByProviderIdOrEmail).mockResolvedValue(null);

    await expect(
      loginExistingUserWithProvider("google", "valid-google-token", undefined, {
        expectedRole: "super_admin",
      }),
    ).rejects.toThrow(UnauthorizedError);

    expect(createGoogleUser).not.toHaveBeenCalled();
  });

  it("loginExistingUserWithProvider rejects wrong role", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-sub-3",
      email: "student@example.com",
      name: "Student",
      profileImage: "",
      emailVerified: true,
    });

    vi.mocked(findUserByProviderIdOrEmail).mockResolvedValue({
      _id: "user-2",
      email: "student@example.com",
      role: "student",
      isBlocked: false,
    } as any);

    await expect(
      loginExistingUserWithProvider("google", "valid-google-token", undefined, {
        expectedRole: "super_admin",
      }),
    ).rejects.toThrow("Admin access required");

    expect(createGoogleUser).not.toHaveBeenCalled();
  });

  it("loginExistingUserWithProvider succeeds for matching role", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-sub-4",
      email: "owner@example.com",
      name: "Owner",
      profileImage: "",
      emailVerified: true,
    });

    vi.mocked(findUserByProviderIdOrEmail).mockResolvedValue({
      _id: "user-3",
      email: "owner@example.com",
      role: "cafe_owner",
      isBlocked: false,
    } as any);

    const result = await loginExistingUserWithProvider(
      "google",
      "valid-google-token",
      undefined,
      { expectedRole: "cafe_owner" },
    );

    expect(result.user.role).toBe("cafe_owner");
    expect(createGoogleUser).not.toHaveBeenCalled();
  });

  it("loginAdminWithProvider rejects unknown admin without invite", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-sub-5",
      email: "admin@example.com",
      name: "Admin",
      profileImage: "",
      emailVerified: true,
    });

    vi.mocked(findUserByProviderIdOrEmail).mockResolvedValue(null);

    await expect(
      loginAdminWithProvider("google", "valid-google-token"),
    ).rejects.toThrow("Admin account not found");

    expect(createAdminGoogleUser).not.toHaveBeenCalled();
  });

  it("loginAdminWithProvider logs in existing super_admin", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-sub-5b",
      email: "admin@example.com",
      name: "Admin",
      profileImage: "",
      emailVerified: true,
    });

    vi.mocked(findUserByProviderIdOrEmail).mockResolvedValue({
      _id: "admin-1",
      email: "admin@example.com",
      role: "super_admin",
      provider: "google",
      providerId: "google-sub-5b",
      isBlocked: false,
    } as any);

    const result = await loginAdminWithProvider("google", "valid-google-token");

    expect(result.user.role).toBe("super_admin");
    expect(createAdminGoogleUser).not.toHaveBeenCalled();
  });

  it("loginOrSignUpCafeOwnerWithProvider creates student when user does not exist", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-sub-6",
      email: "owner@example.com",
      name: "Owner",
      profileImage: "",
      emailVerified: true,
    });

    vi.mocked(findUserByProviderIdOrEmail).mockResolvedValue(null);

    const createdStudent = {
      _id: "owner-1",
      email: "owner@example.com",
      role: "student",
      isBlocked: false,
    } as any;

    vi.mocked(createGoogleUser).mockResolvedValue(createdStudent);

    const result = await loginOrSignUpCafeOwnerWithProvider(
      "google",
      "valid-google-token",
    );

    expect(createGoogleUser).toHaveBeenCalledOnce();
    expect(result.user.role).toBe("student");
  });

  it("loginOrSignUpCafeOwnerWithProvider rejects super_admin portal misuse", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-sub-7",
      email: "admin@example.com",
      name: "Admin",
      profileImage: "",
      emailVerified: true,
    });

    vi.mocked(findUserByProviderIdOrEmail).mockResolvedValue({
      _id: "admin-2",
      email: "admin@example.com",
      role: "super_admin",
      isBlocked: false,
    } as any);

    await expect(
      loginOrSignUpCafeOwnerWithProvider("google", "valid-google-token"),
    ).rejects.toThrow("Please use the admin login portal");
  });
});
