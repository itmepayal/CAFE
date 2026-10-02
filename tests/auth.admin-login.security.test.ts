import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/auth/auth.repository", () => ({
  findUserById: vi.fn(), updateProfileRepo: vi.fn(), findUserByEmailWithPassword: vi.fn(),
  createAdminEmailUser: vi.fn(),
}));
vi.mock("../src/modules/auth/auth.tokens", () => ({
  revokeRefreshToken: vi.fn(), rotateRefreshToken: vi.fn(),
}));
vi.mock("../src/utils/jwt/token.jwt", () => ({ verifyRefreshToken: vi.fn() }));
vi.mock("../src/modules/auth/social-auth.core", () => ({
  loginWithProvider: vi.fn(), loginAdminWithProvider: vi.fn(), loginOrSignUpCafeOwnerWithProvider: vi.fn(),
  authenticateUser: vi.fn(),
}));
vi.mock("../src/modules/admin/admin-invite.service", () => ({
  validateAndConsumeAdminInvite: vi.fn(), markInviteUsedBy: vi.fn(),
}));
vi.mock("../src/utils/auth/password", () => ({ hashPassword: vi.fn(), comparePassword: vi.fn() }));
vi.mock("../src/modules/auth/cafe-owner-auth.meta", () => ({ resolveCafeOwnerLoginMeta: vi.fn() }));
vi.mock("../src/models/user", () => ({ default: { findById: vi.fn() } }));
vi.mock("../src/models/cafe", () => ({ default: { findOne: vi.fn() } }));
vi.mock("../src/modules/auth/session.repository", () => ({ revokeAllSessionsForUser: vi.fn() }));
vi.mock("../src/config/logger.config", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { findUserByEmailWithPassword } from "../src/modules/auth/auth.repository";
import { adminLogin } from "../src/modules/auth/auth.service";
import { comparePassword } from "../src/utils/auth/password";
import { authenticateUser } from "../src/modules/auth/social-auth.core";
import { AccountDeletedError, UnauthorizedError } from "../src/utils/errors/app.error";

describe("admin email login security", () => {
  beforeEach(() => vi.clearAllMocks());

  it("compares the supplied password and authorizes only the super_admin role before issuing tokens", async () => {
    const user = { _id: "root-1", role: "super_admin", passwordHash: "bcrypt-hash" } as any;
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue(user);
    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(authenticateUser).mockResolvedValue({ user, accessToken: "a", refreshToken: "r" } as any);

    await expect(adminLogin({ email: "root@example.com", password: "CorrectPassword1!" }))
      .resolves.toMatchObject({ accessToken: "a", refreshToken: "r" });
    expect(comparePassword).toHaveBeenCalledWith("CorrectPassword1!", "bcrypt-hash");
    expect(authenticateUser).toHaveBeenCalledWith(user, { expectedRole: "super_admin" });
  });

  it("does not authorize or create a session after a wrong password", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue({ passwordHash: "bcrypt-hash" } as any);
    vi.mocked(comparePassword).mockResolvedValue(false);

    await expect(adminLogin({ email: "root@example.com", password: "WrongPassword1!" }))
      .rejects.toMatchObject({ statusCode: 401, message: "Invalid email or password" });
    expect(authenticateUser).not.toHaveBeenCalled();
  });

  it("normalizes role, blocked, and inactive failures to the same 401 message", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue({ passwordHash: "bcrypt-hash" } as any);
    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(authenticateUser).mockRejectedValue(new UnauthorizedError("Admin access required"));

    await expect(adminLogin({ email: "person@example.com", password: "CorrectPassword1!" }))
      .rejects.toMatchObject({ statusCode: 401, message: "Invalid email or password" });
  });

  it("rejects deleted accounts with a generic 403", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue({ passwordHash: "bcrypt-hash" } as any);
    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(authenticateUser).mockRejectedValue(new AccountDeletedError());

    await expect(adminLogin({ email: "person@example.com", password: "CorrectPassword1!" }))
      .rejects.toMatchObject({ statusCode: 403, message: "Admin access unavailable" });
  });
});
