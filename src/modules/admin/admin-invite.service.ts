import crypto from "crypto";
import AdminInvite from "../../models/admin-invite";
import User from "../../models/user";
import { ForbiddenError } from "../../utils/errors/app.error";
import { serverConfig } from "../../config";

const INVITE_EXPIRY_DAYS = 7;

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createAdminInviteService = async (
  createdBy: string,
  email?: string,
): Promise<{ inviteToken: string; expiresAt: Date }> => {
  const inviteToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  await AdminInvite.create({
    email,
    tokenHash: hashToken(inviteToken),
    createdBy,
    expiresAt,
  });

  return { inviteToken, expiresAt };
};

export const validateAndConsumeAdminInvite = async (
  inviteToken: string,
  userEmail?: string,
): Promise<void> => {
  if (
    serverConfig.ADMIN_BOOTSTRAP_TOKEN &&
    inviteToken === serverConfig.ADMIN_BOOTSTRAP_TOKEN
  ) {
    const existingAdmin = await User.findOne({ role: "super_admin" });

    if (existingAdmin) {
      throw new ForbiddenError(
        "Bootstrap token can only be used when no admin exists",
      );
    }

    return;
  }

  const invite = await AdminInvite.findOne({
    tokenHash: hashToken(inviteToken),
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!invite) {
    throw new ForbiddenError("Invalid or expired invite token");
  }

  if (invite.email && userEmail && invite.email !== userEmail.toLowerCase()) {
    throw new ForbiddenError("This invite is restricted to a different email");
  }

  invite.usedAt = new Date();
  await invite.save();
};

export const markInviteUsedBy = async (
  inviteToken: string,
  userId: string,
): Promise<void> => {
  if (
    serverConfig.ADMIN_BOOTSTRAP_TOKEN &&
    inviteToken === serverConfig.ADMIN_BOOTSTRAP_TOKEN
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
