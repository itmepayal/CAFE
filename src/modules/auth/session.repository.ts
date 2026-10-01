import Session, { ISession } from "../../models/session";

interface CreateSessionPayload {
  userId: string;
  sessionId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
}

export const createSession = async (
  payload: CreateSessionPayload,
): Promise<ISession> => {
  return Session.create(payload);
};

export const findActiveSessionByTokenHash = async (
  tokenHash: string,
): Promise<ISession | null> => {
  return Session.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
};

export const revokeSessionByTokenHash = async (
  tokenHash: string,
): Promise<void> => {
  await Session.updateOne({ tokenHash }, { revokedAt: new Date() });
};

export const consumeAndCreateReplacementSession = async (
  input: {
    tokenHash: string;
    userId: string;
    sessionId: string;
    familyId: string;
  },
  replacement: CreateSessionPayload,
): Promise<boolean> => {
  const mongoSession = await Session.startSession();
  try {
    const rotated = await mongoSession.withTransaction(async () => {
      const consumed = await Session.findOneAndUpdate(
        {
          ...input,
          revokedAt: null,
          expiresAt: { $gt: new Date() },
        },
        { $set: { revokedAt: new Date() } },
        { new: false, session: mongoSession },
      );
      if (!consumed) return false;

      await Session.create([replacement], { session: mongoSession });
      return true;
    });
    return rotated === true;
  } finally {
    await mongoSession.endSession();
  }
};

export const revokeSessionByTokenHashAndUser = async (
  tokenHash: string,
  userId: string,
): Promise<boolean> => {
  const result = await Session.updateOne(
    { tokenHash, userId, revokedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { revokedAt: new Date() } },
  );
  return result.modifiedCount === 1;
};

export const revokeSessionFamily = async (familyId: string): Promise<void> => {
  await Session.updateMany(
    { familyId, revokedAt: null },
    { revokedAt: new Date() },
  );
};

export const revokeAllSessionsForUser = async (userId: string): Promise<number> => {
  const result = await Session.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() },
  );
  return result.modifiedCount;
};
