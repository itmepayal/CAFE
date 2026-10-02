import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionState = vi.hoisted(() => ({ consumed: false, replacements: 0, generated: 0 }));
vi.mock("../src/modules/auth/session.repository", () => ({
  createSession: vi.fn(async () => ({} as any)),
  consumeAndCreateReplacementSession: vi.fn(async () => {
    if (sessionState.consumed) return false;
    sessionState.consumed = true;
    sessionState.replacements += 1;
    return true;
  }),
}));
vi.mock("../src/utils/jwt/token.jwt", () => ({
  generateAccessToken: vi.fn(() => "access"),
  generateRefreshToken: vi.fn((_args: unknown) => {
    const n = ++sessionState.generated;
    return { refreshToken: "replacement-" + n, tokenHash: "replacement-hash-" + n };
  }),
}));

import { rotateRefreshToken } from "../src/modules/auth/auth.tokens";
import { consumeAndCreateReplacementSession } from "../src/modules/auth/session.repository";
import { UnauthorizedError } from "../src/utils/errors/app.error";

describe("single-use refresh rotation", () => {
  beforeEach(() => {
    sessionState.consumed = false;
    sessionState.replacements = 0;
    sessionState.generated = 0;
    vi.clearAllMocks();
    vi.mocked(consumeAndCreateReplacementSession).mockImplementation(async () => {
      if (sessionState.consumed) return false;
      sessionState.consumed = true;
      sessionState.replacements += 1;
      return true;
    });
  });

  it("allows only one concurrent rotation of the same refresh session", async () => {
    const user = { _id: { toString: () => "user1" } } as any;
    const decoded = { sessionId: "session1", familyId: "family1" };
    const outcomes = await Promise.allSettled([
      rotateRefreshToken(user, "old-token", decoded),
      rotateRefreshToken(user, "old-token", decoded),
    ]);
    expect(outcomes.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(sessionState.replacements).toBe(1);
  });

  it("rejects reuse of the consumed old refresh token", async () => {
    const user = { _id: { toString: () => "user1" } } as any;
    const decoded = { sessionId: "session1", familyId: "family1" };
    await rotateRefreshToken(user, "old-token", decoded);
    await expect(rotateRefreshToken(user, "old-token", decoded)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(sessionState.replacements).toBe(1);
  });
});
