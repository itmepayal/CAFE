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

export const revokeSessionFamily = async (familyId: string): Promise<void> => {
  await Session.updateMany(
    { familyId, revokedAt: null },
    { revokedAt: new Date() },
  );
};
