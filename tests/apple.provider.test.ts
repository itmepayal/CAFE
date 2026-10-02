import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyIdTokenMock } = vi.hoisted(() => ({ verifyIdTokenMock: vi.fn() }));

vi.mock("apple-signin-auth", () => ({
  default: { verifyIdToken: (...args: unknown[]) => verifyIdTokenMock(...args) },
}));

import { serverConfig } from "../src/config";
import { verifyAppleToken } from "../src/providers/apple.provider";

describe("Apple identity token verification", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([true, "true"] as const)(
    "uses Apple subject and normalizes verified email claim %s",
    async (emailVerified) => {
      verifyIdTokenMock.mockResolvedValueOnce({
        sub: "stable-apple-subject",
        email: "person@privaterelay.appleid.com",
        email_verified: emailVerified,
      });

      const profile = await verifyAppleToken("signed-apple-token");

      expect(profile).toMatchObject({
        providerId: "stable-apple-subject",
        email: "person@privaterelay.appleid.com",
        emailVerified: true,
      });
      expect(verifyIdTokenMock).toHaveBeenCalledWith("signed-apple-token", {
        audience: serverConfig.APPLE_CLIENT_ID,
        ignoreExpiration: false,
      });
    },
  );

  it.each([false, "false"] as const)("does not mark unverified email claim %s as verified", async (emailVerified) => {
    verifyIdTokenMock.mockResolvedValueOnce({
      sub: "stable-apple-subject",
      email: "person@example.com",
      email_verified: emailVerified,
    });
    const profile = await verifyAppleToken("signed-apple-token");
    expect(profile.emailVerified).toBe(false);
  });

  it.each(["invalid signature", "wrong audience", "expired token"])(
    "rejects Apple verifier failure: %s",
    async (reason) => {
      verifyIdTokenMock.mockRejectedValueOnce(new Error(reason));
      await expect(verifyAppleToken("invalid-token")).rejects.toThrow("Invalid Apple token");
    },
  );
});
