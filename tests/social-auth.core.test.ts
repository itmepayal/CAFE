import { describe, expect, it, vi, beforeEach } from "vitest";
import { ConflictError, UnauthorizedError } from "../src/utils/errors/app.error";

vi.mock("../src/providers/google.provider", () => ({
  verifyGoogleToken: vi.fn(),
}));

vi.mock("../src/providers/apple.provider", () => ({
  verifyAppleToken: vi.fn(),
}));

vi.mock("../src/modules/auth/auth.repository", () => ({
  findUserByProviderIdentity: vi.fn(),
  findUserByEmail: vi.fn(),
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
  findUserByProviderIdentity,
  findUserByEmail,
  createGoogleUser,
  createAppleUser,
  createAdminGoogleUser,
} from "../src/modules/auth/auth.repository";
import { issueAuthTokens } from "../src/modules/auth/auth.tokens";
import {
  authenticateUser,
  loginExistingUserWithProvider,
  loginWithProvider,
  loginAdminWithProvider,
  loginOrSignUpCafeOwnerWithProvider,
} from "../src/modules/auth/social-auth.core";

describe("social-auth.core", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findUserByProviderIdentity).mockResolvedValue(null);
    vi.mocked(findUserByEmail).mockResolvedValue(null);
  });

  it("rejects unverified Google email before lookup or session creation", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-unverified",
      email: "unverified@example.com",
      emailVerified: false,
    } as any);
    await expect(loginWithProvider("google", "token")).rejects.toThrow(UnauthorizedError);
    expect(findUserByProviderIdentity).not.toHaveBeenCalled();
    expect(findUserByEmail).not.toHaveBeenCalled();
    expect(issueAuthTokens).not.toHaveBeenCalled();
  });

  it("rejects unverified Apple email before lookup or session creation", async () => {
    const { verifyAppleToken } = await import("../src/providers/apple.provider");
    vi.mocked(verifyAppleToken).mockResolvedValue({
      providerId: "apple-unverified",
      email: "unverified@example.com",
      emailVerified: false,
    } as any);
    await expect(loginWithProvider("apple", undefined, "token")).rejects.toThrow(UnauthorizedError);
    expect(findUserByProviderIdentity).not.toHaveBeenCalled();
    expect(findUserByEmail).not.toHaveBeenCalled();
    expect(issueAuthTokens).not.toHaveBeenCalled();
  });

  it.each([
    { providerId: "", email: "missing-id@example.com", emailVerified: true },
    { providerId: "google-missing-email", email: undefined, emailVerified: true },
    { providerId: "google-unverified-flag", email: "flag@example.com", emailVerified: undefined },
  ])("rejects incomplete or unverified Google identity before lookup", async (identity) => {
    vi.mocked(verifyGoogleToken).mockResolvedValue(identity as any);
    await expect(loginWithProvider("google", "token")).rejects.toThrow(UnauthorizedError);
    expect(findUserByProviderIdentity).not.toHaveBeenCalled();
    expect(findUserByEmail).not.toHaveBeenCalled();
    expect(issueAuthTokens).not.toHaveBeenCalled();
  });

  it.each([
    { provider: "google", existingProvider: "google" },
    { provider: "google", existingProvider: "apple" },
    { provider: "apple", existingProvider: "apple" },
    { provider: "apple", existingProvider: "google" },
  ] as const)("rejects email-only OAuth association ($provider vs $existingProvider)", async ({ provider, existingProvider }) => {
    const identityId = `${provider}-incoming`;
    const email = "same@example.com";
    if (provider === "google") {
      vi.mocked(verifyGoogleToken).mockResolvedValue({
        providerId: identityId, email, emailVerified: true,
      } as any);
    } else {
      const { verifyAppleToken } = await import("../src/providers/apple.provider");
      vi.mocked(verifyAppleToken).mockResolvedValue({
        providerId: identityId, email, emailVerified: true,
      } as any);
    }
    vi.mocked(findUserByProviderIdentity).mockResolvedValue(null);
    vi.mocked(findUserByEmail).mockResolvedValue({
      _id: "existing-user", provider: existingProvider,
      providerId: `${existingProvider}-stored`, email, role: "student",
      isActive: true, isBlocked: false,
    } as any);

    await expect(loginWithProvider(provider, provider === "google" ? "token" : undefined,
      provider === "apple" ? "token" : undefined)).rejects.toThrow(ConflictError);
    expect(createGoogleUser).not.toHaveBeenCalled();
    expect(issueAuthTokens).not.toHaveBeenCalled();
  });

  it("accepts only an exact same-provider identity match", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-exact", email: "identity@example.com", emailVerified: true,
    } as any);
    vi.mocked(findUserByProviderIdentity).mockResolvedValue({
      _id: "user-exact", provider: "google", providerId: "google-exact",
      email: "identity@example.com", role: "student", isActive: true, isBlocked: false,
    } as any);

    const result = await loginWithProvider("google", "token");
    expect(result.user._id).toBe("user-exact");
    expect(findUserByEmail).not.toHaveBeenCalled();
    expect(issueAuthTokens).toHaveBeenCalledOnce();
  });

  it.each([
    { isActive: false, isBlocked: false },
    { isActive: true, isBlocked: true },
  ])("rejects disabled or blocked OAuth identities without account creation: $isActive/$isBlocked", async ({ isActive, isBlocked }) => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-disabled", email: "disabled@example.com", emailVerified: true,
    } as any);
    vi.mocked(findUserByProviderIdentity).mockResolvedValue({
      _id: "disabled-user", provider: "google", providerId: "google-disabled",
      email: "disabled@example.com", role: "student", isActive, isBlocked,
    } as any);

    await expect(loginWithProvider("google", "token")).rejects.toThrow(UnauthorizedError);
    expect(createGoogleUser).not.toHaveBeenCalled();
    expect(issueAuthTokens).not.toHaveBeenCalled();
  });

  it("creates a verified Apple identity with its intended role", async () => {
    const { verifyAppleToken } = await import("../src/providers/apple.provider");
    vi.mocked(verifyAppleToken).mockResolvedValue({
      providerId: "apple-new", email: "apple@example.com", emailVerified: true,
    } as any);
    vi.mocked(findUserByProviderIdentity).mockResolvedValue(null);
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(createAppleUser).mockResolvedValue({
      _id: "apple-user", provider: "apple", providerId: "apple-new",
      email: "apple@example.com", role: "student", isActive: true, isBlocked: false,
    } as any);

    const result = await loginWithProvider("apple", undefined, "valid-apple-token");
    expect(createAppleUser).toHaveBeenCalledWith(expect.objectContaining({
      providerId: "apple-new", email: "apple@example.com", role: "student",
    }));
    expect(result.user.role).toBe("student");
    expect(issueAuthTokens).toHaveBeenCalledOnce();
  });

  it("does not create tokens when a concurrent duplicate identity cannot be resolved", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-race", email: "race@example.com", emailVerified: true,
    } as any);
    vi.mocked(findUserByProviderIdentity).mockResolvedValue(null);
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(createGoogleUser).mockRejectedValue(new ConflictError("OAuth identity conflicts with an existing account"));

    await expect(loginWithProvider("google", "valid-google-token")).rejects.toThrow(ConflictError);
    expect(issueAuthTokens).not.toHaveBeenCalled();
  });

  it.each([
    { isActive: true, isBlocked: false, rejects: false },
    { isActive: true, isBlocked: true, rejects: true },
    { isActive: false, isBlocked: false, rejects: true },
    { isActive: false, isBlocked: true, rejects: true },
  ])("enforces admin account status before issuing tokens: $isActive/$isBlocked", async ({ isActive, isBlocked, rejects }) => {
    const { issueAuthTokens } = await import("../src/modules/auth/auth.tokens");
    const { updateUserSession } = await import("../src/modules/auth/auth.repository");
    vi.mocked(updateUserSession).mockClear();
    vi.mocked(issueAuthTokens).mockClear();
    const user = {
      _id: "admin-status-test",
      role: "super_admin",
      isActive,
      isBlocked,
    } as any;

    const result = authenticateUser(user, { expectedRole: "super_admin" });
    if (rejects) {
      await expect(result).rejects.toThrow(UnauthorizedError);
      expect(updateUserSession).not.toHaveBeenCalled();
      expect(issueAuthTokens).not.toHaveBeenCalled();
    } else {
      await expect(result).resolves.toMatchObject({ accessToken: "access-token", refreshToken: "refresh-token" });
      expect(updateUserSession).toHaveBeenCalledOnce();
      expect(issueAuthTokens).toHaveBeenCalledOnce();
    }
  });

  it("loginWithProvider creates a student when user does not exist", async () => {
    vi.mocked(verifyGoogleToken).mockResolvedValue({
      providerId: "google-sub-1",
      email: "student@example.com",
      name: "Student",
      profileImage: "",
      emailVerified: true,
    });

    vi.mocked(findUserByProviderIdentity).mockResolvedValue(null);

    const createdUser = {
      _id: "user-1",
      email: "student@example.com",
      role: "student",
      isBlocked: false,
      isActive: true,
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

    vi.mocked(findUserByProviderIdentity).mockResolvedValue(null);

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

    vi.mocked(findUserByProviderIdentity).mockResolvedValue({
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

    vi.mocked(findUserByProviderIdentity).mockResolvedValue({
      _id: "user-3",
      email: "owner@example.com",
      role: "cafe_owner",
      isBlocked: false,
      isActive: true,
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

    vi.mocked(findUserByProviderIdentity).mockResolvedValue(null);

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

    vi.mocked(findUserByProviderIdentity).mockResolvedValue({
      _id: "admin-1",
      email: "admin@example.com",
      role: "super_admin",
      provider: "google",
      providerId: "google-sub-5b",
      isBlocked: false,
      isActive: true,
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

    vi.mocked(findUserByProviderIdentity).mockResolvedValue(null);

    const createdStudent = {
      _id: "owner-1",
      email: "owner@example.com",
      role: "student",
      isBlocked: false,
      isActive: true,
    } as any;

    vi.mocked(createGoogleUser).mockResolvedValue(createdStudent);

    const result = await loginOrSignUpCafeOwnerWithProvider(
      "google",
      "valid-google-token",
    );

    expect(createGoogleUser).toHaveBeenCalledOnce();
    expect(createGoogleUser).toHaveBeenCalledWith(expect.objectContaining({ role: "cafe_owner" }));
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

    vi.mocked(findUserByProviderIdentity).mockResolvedValue({
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
