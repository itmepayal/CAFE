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
import { logout, refreshTokens } from "../src/modules/auth/auth.service";

describe("refresh and logout account status/session ownership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows an active user to refresh", async () => {
    vi.mocked(findUserById).mockResolvedValue({ _id: "u1", isActive: true, isBlocked: false } as any);
    await expect(refreshTokens({ refreshToken: "valid" })).resolves.toMatchObject({ accessToken: "a", refreshToken: "r" });
    expect(rotateRefreshToken).toHaveBeenCalledOnce();
  });

  it.each([
    [{ _id: "u1", isActive: true, isBlocked: true }, "blocked"],
    [{ _id: "u1", isActive: false, isBlocked: false }, "inactive"],
  ])("rejects %s users before rotation", async (user) => {
    vi.mocked(findUserById).mockResolvedValue(user as any);
    await expect(refreshTokens({ refreshToken: "valid" })).rejects.toThrow(/Account/);
    expect(rotateRefreshToken).not.toHaveBeenCalled();
  });

  it("revokes logout using the authenticated user ID", async () => {
    await logout("user-a", "own-refresh");
    expect(revokeRefreshToken).toHaveBeenCalledWith("user-a", "own-refresh");
  });

  it("maps a refresh token not owned by the user to an auth rejection", async () => {
    vi.mocked(revokeRefreshToken).mockRejectedValue(new Error("not owned"));
    await expect(logout("user-a", "user-b-refresh")).rejects.toMatchObject({ statusCode: 401 });
  });
});
