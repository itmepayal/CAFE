import AuditLog, { AuditAction } from "../../models/audit-log";
import logger from "../../config/logger.config";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "authorization",
]);

const scrub = (
  metadata?: Record<string, unknown>,
): Record<string, unknown> => {
  if (!metadata) return {};
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
    clean[key] = value;
  }
  return clean;
};

export const writeAuditLog = async (input: {
  actorId: string;
  actorRole: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  try {
    await AuditLog.create({
      actorId: input.actorId,
      actorRole: input.actorRole,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      requestId: input.requestId,
      metadata: scrub(input.metadata),
    });
  } catch (error) {
    // Audit must never break the primary action
    logger.error("Failed to write audit log", {
      action: input.action,
      targetId: input.targetId,
      error,
    });
  }
};
