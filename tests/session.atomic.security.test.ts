import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/models/session", () => ({
  default: {
    findOneAndUpdate: vi.fn(), create: vi.fn(), updateOne: vi.fn(),
    startSession: vi.fn(async () => ({
      withTransaction: vi.fn(async (fn: () => Promise<unknown>) => fn()),
      endSession: vi.fn(async () => {}),
    })),
  },
}));
import Session from "../src/models/session";
import { consumeAndCreateReplacementSession, revokeSessionByTokenHashAndUser } from "../src/modules/auth/session.repository";

describe("atomic session security operations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scopes logout revocation to an active session owned by the authenticated user", async () => {
    vi.mocked(Session.updateOne).mockResolvedValue({ modifiedCount: 1 } as never);
    await expect(revokeSessionByTokenHashAndUser("h", "user-a")).resolves.toBe(true);
    expect(Session.updateOne).toHaveBeenCalledWith(
      { tokenHash: "h", userId: "user-a", revokedAt: null, expiresAt: expect.any(Object) },
      { $set: { revokedAt: expect.any(Date) } },
    );
  });

  it("does not revoke an invalid, expired, or already-revoked session", async () => {
    vi.mocked(Session.updateOne).mockResolvedValue({ modifiedCount: 0 } as never);
    await expect(revokeSessionByTokenHashAndUser("old-or-revoked-hash", "user-a")).resolves.toBe(false);
    expect(Session.updateOne).toHaveBeenCalledWith(
      { tokenHash: "old-or-revoked-hash", userId: "user-a", revokedAt: null, expiresAt: expect.any(Object) },
      { $set: { revokedAt: expect.any(Date) } },
    );
  });

  it("inserts a replacement only after consuming the matching active session in one transaction", async () => {
    vi.mocked(Session.findOneAndUpdate).mockResolvedValue({ _id: "old" } as never);
    vi.mocked(Session.create).mockResolvedValue([{}] as never);
    await expect(consumeAndCreateReplacementSession(
      { tokenHash: "old-hash", userId: "u", sessionId: "s", familyId: "f" },
      { userId: "u", sessionId: "next", familyId: "f", tokenHash: "new-hash", expiresAt: new Date() },
    )).resolves.toBe(true);
    expect(Session.findOneAndUpdate).toHaveBeenCalledOnce();
    expect(Session.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: "old-hash", userId: "u", sessionId: "s", familyId: "f", revokedAt: null, expiresAt: expect.any(Object) }),
      { $set: { revokedAt: expect.any(Date) } },
      { new: false, session: expect.any(Object) },
    );
    expect(Session.create).toHaveBeenCalledOnce();
    expect(Session.findOneAndUpdate.mock.invocationCallOrder[0]).toBeLessThan(Session.create.mock.invocationCallOrder[0]);
    expect(Session.create).toHaveBeenCalledWith([expect.objectContaining({ tokenHash: "new-hash" })], { session: expect.any(Object) });
  });

  it("does not create a replacement when the old session cannot be consumed", async () => {
    vi.mocked(Session.findOneAndUpdate).mockResolvedValue(null);
    await expect(consumeAndCreateReplacementSession(
      { tokenHash: "old-hash", userId: "u", sessionId: "s", familyId: "f" },
      { userId: "u", sessionId: "next", familyId: "f", tokenHash: "new-hash", expiresAt: new Date() },
    )).resolves.toBe(false);
    expect(Session.create).not.toHaveBeenCalled();
  });

  it("propagates replacement-write failures so the transaction can abort", async () => {
    const transactionSession = {
      withTransaction: vi.fn(async (callback: () => Promise<unknown>) => callback()),
      endSession: vi.fn(async () => {}),
    };
    vi.mocked(Session.startSession).mockResolvedValueOnce(transactionSession as never);
    vi.mocked(Session.findOneAndUpdate).mockResolvedValue({ _id: "old" } as never);
    vi.mocked(Session.create).mockRejectedValueOnce(new Error("write failed"));

    await expect(consumeAndCreateReplacementSession(
      { tokenHash: "old-hash", userId: "u", sessionId: "s", familyId: "f" },
      { userId: "u", sessionId: "next", familyId: "f", tokenHash: "new-hash", expiresAt: new Date() },
    )).rejects.toThrow("write failed");

    expect(transactionSession.withTransaction).toHaveBeenCalledOnce();
    expect(Session.create).toHaveBeenCalledWith([expect.objectContaining({ tokenHash: "new-hash" })], { session: transactionSession });
    expect(transactionSession.endSession).toHaveBeenCalledOnce();
  });
});
