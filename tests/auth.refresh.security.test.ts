import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/auth/auth.repository", () => ({
  findUserById: vi.fn(), updateProfileRepo: vi.fn(), findUserByEmailWithPassword: vi.fn(), createAdminEmailUser: vi.fn(),
}));
vi.mock("../src/modules/auth/auth.tokens", () => ({
  revokeRefreshToken: vi.fn(), rotateRefreshToken: vi.fn(async () => ({ accessToken: "a", refreshToken: "r", user: {} })),
}));
vi.mock("../src/utils/jwt/token.jwt", () => ({ verifyRefreshToken: vi.fn(() => ({ sub: "u1", sessionId: "s1", familyId: "f1" })) }));
vi.mock("../src/modules/auth/social-auth.core", () => ({
  loginWithProvider: vi.fn(), loginAdminWithProvider: vi.fn(), loginOrSignUpCafeOwnerWithProvider: vi.fn(), authenticateUser: vi.fn(),
}));
vi.mock("../src/modules/admin/admin-invite.service", () => ({ validateAndConsumeAdminInvite: vi.fn(), markInviteUsedBy: vi.fn() }));
vi.mock("../src/utils/auth/password", () => ({ hashPassword: vi.fn(), comparePassword: vi.fn() }));
vi.mock("../src/modules/auth/cafe-owner-auth.meta", () => ({ resolveCafeOwnerLoginMeta: vi.fn() }));
vi.mock("../src/models/user", () => ({ default: { findById: vi.fn() } }));
vi.mock("../src/models/cafe", () => ({ default: { findOne: vi.fn() } }));
vi.mock("../src/modules/auth/session.repository", () => ({ revokeAllSessionsForUser: vi.fn() }));
vi.mock("../src/config/logger.config", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }, default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { findUserById } from "../src/modules/auth/auth.repository";
import { rotateRefreshToken, revokeRefreshToken } from "../src/modules/auth/auth.tokens";
import { verifyRefreshToken } from "../src/utils/jwt/token.jwt";
import { logout, refreshTokens } from "../src/modules/auth/auth.service";
import { UnauthorizedError } from "../src/utils/errors/app.error";
import { logger } from "../src/config/logger.config";

describe("refresh and logout account status/session ownership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows an active user to refresh", async () => {
    vi.mocked(findUserById).mockResolvedValue({ _id: "u1", isActive: true, isBlocked: false } as any);
    await expect(refreshTokens({ refreshToken: "valid" })).resolves.toMatchObject({ accessToken: "a", refreshToken: "r" });
    expect(rotateRefreshToken).toHaveBeenCalledOnce();
  });

  it("rejects an invalid refresh JWT before user lookup or rotation", async () => {
    vi.mocked(verifyRefreshToken).mockImplementationOnce(() => { throw new Error("invalid"); });
    await expect(refreshTokens({ refreshToken: "invalid" })).rejects.toMatchObject({ statusCode: 401 });
    expect(findUserById).not.toHaveBeenCalled();
    expect(rotateRefreshToken).not.toHaveBeenCalled();
  });

  it("preserves authentication failures from session rotation as 401", async () => {
    vi.mocked(findUserById).mockResolvedValue({ _id: "u1", isActive: true, isBlocked: false } as any);
    vi.mocked(rotateRefreshToken).mockRejectedValueOnce(new UnauthorizedError("Invalid or expired refresh token"));
    await expect(refreshTokens({ refreshToken: "replayed" })).rejects.toMatchObject({ statusCode: 401 });
  });

  it.each([
    Object.assign(new Error("server selection timeout"), { name: "MongoServerSelectionError" }),
    Object.assign(new Error("transaction unsupported"), { name: "MongoServerError", code: 20 }),
    new Error("unexpected repository failure"),
  ])("classifies rotation infrastructure failures as 5xx", async (failure) => {
    vi.mocked(findUserById).mockResolvedValue({ _id: "u1", isActive: true, isBlocked: false } as any);
    vi.mocked(rotateRefreshToken).mockRejectedValueOnce(failure);
    await expect(refreshTokens({ refreshToken: "secret-refresh-token" })).rejects.toMatchObject({ statusCode: 500 });
    expect(logger.error).toHaveBeenCalledWith("Refresh token rotation failed", expect.objectContaining({ userId: "u1", error: failure }));
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain("secret-refresh-token");
  });

  it.each([
    [{ _id: "u1", isActive: true, isBlocked: true }, "blocked"],
    [{ _id: "u1", isActive: false, isBlocked: false }, "inactive"],
  ])("rejects %s users before rotation", async (user) => {
    vi.mocked(findUserById).mockResolvedValue(user as any);
    await expect(refreshTokens({ refreshToken: "valid" })).rejects.toThrow(/Account/);
    expect(rotateRefreshToken).not.toHaveBeenCalled();
  });

  it("rejects refresh after account deletion and never rotates the revoked session", async () => {
    vi.mocked(findUserById).mockResolvedValue({
      _id: "u1", isActive: false, isBlocked: true, deletedAt: new Date(),
    } as any);
    await expect(refreshTokens({ refreshToken: "pre-deletion-refresh" }))
      .rejects.toMatchObject({ statusCode: 401 });
    expect(rotateRefreshToken).not.toHaveBeenCalled();
  });

  it("revokes logout using the authenticated user ID", async () => {
    await logout("user-a", "own-refresh");
    expect(revokeRefreshToken).toHaveBeenCalledWith("user-a", "own-refresh");
  });

  it("treats a missing refresh token as cookie-clearing logout without revoking another session", async () => {
    await expect(logout("user-a")).resolves.toBeUndefined();
    expect(revokeRefreshToken).toHaveBeenCalledWith("user-a", undefined);
  });

  it("maps a refresh token not owned by the user to an auth rejection", async () => {
    vi.mocked(revokeRefreshToken).mockRejectedValue(new Error("not owned"));
    await expect(logout("user-a", "user-b-refresh")).rejects.toMatchObject({ statusCode: 401 });
  });
});
