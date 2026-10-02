import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { revokeSessionByTokenHashAndUserMock } = vi.hoisted(() => ({
  revokeSessionByTokenHashAndUserMock: vi.fn(),
}));

vi.mock("../src/modules/auth/session.repository", () => ({
  createSession: vi.fn(),
  consumeAndCreateReplacementSession: vi.fn(),
  revokeSessionByTokenHashAndUser: (...args: unknown[]) => revokeSessionByTokenHashAndUserMock(...args),
}));

import { revokeRefreshToken } from "../src/modules/auth/auth.tokens";

describe("logout refresh-token handling", () => {
  beforeEach(() => vi.clearAllMocks());

  it("hashes the supplied token before repository lookup and binds it to the authenticated user", async () => {
    revokeSessionByTokenHashAndUserMock.mockResolvedValueOnce(true);
    const rawToken = "sensitive-refresh-token";
    const expectedHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await expect(revokeRefreshToken("authenticated-user", rawToken)).resolves.toBeUndefined();
    expect(revokeSessionByTokenHashAndUserMock).toHaveBeenCalledWith(expectedHash, "authenticated-user");
    expect(revokeSessionByTokenHashAndUserMock).not.toHaveBeenCalledWith(rawToken, expect.anything());
  });

  it("rejects replay of an already revoked or expired refresh session", async () => {
    revokeSessionByTokenHashAndUserMock.mockResolvedValueOnce(false);
    await expect(revokeRefreshToken("authenticated-user", "old-token"))
      .rejects.toThrow("Refresh session not found for authenticated user");
  });

  it("does not query or revoke any session when no refresh token was supplied", async () => {
    await expect(revokeRefreshToken("authenticated-user")).resolves.toBeUndefined();
    expect(revokeSessionByTokenHashAndUserMock).not.toHaveBeenCalled();
  });
});
