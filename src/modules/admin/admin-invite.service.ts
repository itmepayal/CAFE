import crypto from "crypto";
import AdminInvite from "../../models/admin-invite";
import User from "../../models/user";
import { ForbiddenError } from "../../utils/errors/app.error";
import { serverConfig } from "../../config";

const INVITE_EXPIRY_MINUTES = 30;

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createAdminInviteService = async (
  createdBy: string,
  email?: string,
): Promise<{ inviteToken: string; expiresAt: Date }> => {
  const expiresAt = new Date(
    Date.now() + INVITE_EXPIRY_MINUTES * 60 * 1000,
  );

  let inviteToken = "";
  const maxRetries = 5;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    inviteToken = crypto.randomInt(10000000, 100000000).toString();
    const tokenHashStr = hashToken(inviteToken);

    try {
      await AdminInvite.create({
        email,
        tokenHash: tokenHashStr,
        createdBy,
        expiresAt,
      });
      return { inviteToken, expiresAt };
    } catch (err: any) {
      if (err.code === 11000 && attempt < maxRetries) {
        continue;
      }
      throw err;
    }
  }

  throw new Error("Failed to generate a unique admin invite token");
};

export const validateAndConsumeAdminInvite = async (
  inviteToken?: string,
  userEmail?: string,
): Promise<{ isBootstrap: boolean }> => {
  const existingAdmin = await User.findOne({
    role: { $in: ["super_admin", "admin"] },
  });

  if (!existingAdmin) {
    if (serverConfig.ADMIN_BOOTSTRAP_TOKEN) {
      if (!inviteToken) throw new ForbiddenError("Bootstrap token is required");
      if (inviteToken === serverConfig.ADMIN_BOOTSTRAP_TOKEN) {
        return { isBootstrap: true };
      }
    }

    if (!inviteToken) {
      throw new ForbiddenError("Admin invite token is required for registration");
    }
    return consumeInvite(inviteToken, userEmail);
  }

  if (!inviteToken) {
    throw new ForbiddenError(
      "Admin invite token is required for registration",
    );
  }

  if (
    serverConfig.ADMIN_BOOTSTRAP_TOKEN &&
    inviteToken === serverConfig.ADMIN_BOOTSTRAP_TOKEN
  ) {
    throw new ForbiddenError(
      "Bootstrap token can only be used when no admin exists",
    );
  }

  return consumeInvite(inviteToken, userEmail);
};

const consumeInvite = async (
  inviteToken: string,
  userEmail?: string,
): Promise<{ isBootstrap: false }> => {
  const tokenHash = hashToken(inviteToken);
  const now = new Date();
  const invite = await AdminInvite.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: now },
  });
  if (!invite) throw new ForbiddenError("Invalid or expired invite token");

  const normalizedEmail = userEmail?.toLowerCase().trim();
  if (invite.email && invite.email !== normalizedEmail) {
    throw new ForbiddenError("This invite is restricted to a different email");
  }

  const consumed = await AdminInvite.findOneAndUpdate(
    {
      tokenHash,
      usedAt: null,
      expiresAt: { $gt: now },
      ...(invite.email ? { email: invite.email } : {}),
    },
    { $set: { usedAt: now } },
    { new: true },
  );
  if (!consumed) throw new ForbiddenError("Invalid or expired invite token");
  return { isBootstrap: false };
};

export const markInviteUsedBy = async (
  inviteToken: string | undefined,
  userId: string,
): Promise<void> => {
  if (
    !inviteToken ||
    (serverConfig.ADMIN_BOOTSTRAP_TOKEN &&
      inviteToken === serverConfig.ADMIN_BOOTSTRAP_TOKEN)
  ) {
    return;
  }

  await AdminInvite.updateOne(
    { tokenHash: hashToken(inviteToken), usedBy: null },
    { usedBy: userId },
  );
};

export const listAdminInvitesService = async (
  page: number = 1,
  limit: number = 50,
) => {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  const [invites, total] = await Promise.all([
    AdminInvite.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("createdBy", "name email")
      .populate("usedBy", "name email")
      .lean(),
    AdminInvite.countDocuments(),
  ]);

  return { invites, total, page: safePage, limit: safeLimit };
};
