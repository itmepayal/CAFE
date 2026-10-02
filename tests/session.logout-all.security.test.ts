import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateManyMock, findOneAndUpdateMock, createMock } = vi.hoisted(() => ({
  updateManyMock: vi.fn(),
  findOneAndUpdateMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("../src/models/session", () => ({
  default: {
    updateMany: (...args: unknown[]) => updateManyMock(...args),
    findOneAndUpdate: (...args: unknown[]) => findOneAndUpdateMock(...args),
    create: (...args: unknown[]) => createMock(...args),
    startSession: vi.fn(async () => ({
      withTransaction: async (callback: () => Promise<unknown>) => callback(),
      endSession: vi.fn(),
    })),
  },
}));

import Session from "../src/models/session";
import {
  consumeAndCreateReplacementSession,
  revokeAllSessionsForUser,
} from "../src/modules/auth/session.repository";

describe("logout-all session isolation and replay protection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("revokes active sessions across devices for the authenticated user only", async () => {
    const sessions = [
      { userId: "user-a", sessionId: "a-device-1", revokedAt: null },
      { userId: "user-a", sessionId: "a-device-2", revokedAt: null },
      { userId: "user-a", sessionId: "a-device-3", revokedAt: null },
      { userId: "user-a", sessionId: "a-old", revokedAt: new Date("2026-01-01") },
      { userId: "user-b", sessionId: "b-device-1", revokedAt: null },
    ];
    updateManyMock.mockImplementation(async (filter, update) => {
      let modifiedCount = 0;
      for (const session of sessions) {
        if (session.userId === filter.userId && session.revokedAt === filter.revokedAt) {
          session.revokedAt = update.revokedAt;
          modifiedCount += 1;
        }
      }
      return { modifiedCount };
    });

    const result = await revokeAllSessionsForUser("user-a");

    expect(result).toBe(3);
    expect(updateManyMock).toHaveBeenCalledWith(
      { userId: "user-a", revokedAt: null },
      { revokedAt: expect.any(Date) },
    );
    expect(sessions.filter((session) => session.userId === "user-a" && session.revokedAt === null)).toHaveLength(0);
    expect(sessions.find((session) => session.sessionId === "b-device-1")?.revokedAt).toBeNull();
    expect(sessions.find((session) => session.sessionId === "a-old")?.revokedAt).toEqual(new Date("2026-01-01"));
  });

  it("cannot replay a refresh session after logout-all", async () => {
    findOneAndUpdateMock.mockResolvedValueOnce(null);
    await expect(consumeAndCreateReplacementSession(
      { tokenHash: "old-hash", userId: "user-a", sessionId: "old-session", familyId: "family-a" },
      { userId: "user-a", sessionId: "new-session", familyId: "family-a", tokenHash: "new-hash", expiresAt: new Date() },
    )).resolves.toBe(false);
    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: "old-hash", userId: "user-a", revokedAt: null }),
      { $set: { revokedAt: expect.any(Date) } },
      expect.any(Object),
    );
    expect(createMock).not.toHaveBeenCalled();
  });
});
