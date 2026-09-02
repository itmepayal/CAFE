import { IUser } from "../../models/user";
import { verifyRefreshToken } from "../../utils/jwt/token.jwt";
import { UnauthorizedError, ConflictError } from "../../utils/errors/app.error";
import {
  findUserById,
  updateProfileRepo,
  findUserByEmailWithPassword,
  createAdminEmailUser,
} from "./auth.repository";
import { logger } from "../../config/logger.config";
import {
  AdminEmailLoginPayload,
  AdminEmailRegisterPayload,
  AdminLoginPayload,
  RefreshTokenPayload,
  UpdateProfilePayload,
} from "./auth.type";
import {
  revokeRefreshToken,
  rotateRefreshToken,
  AuthTokensResult,
} from "./auth.tokens";
import {
  loginWithProvider,
  loginAdminWithProvider,
  loginOrSignUpCafeOwnerWithProvider,
  authenticateUser,
} from "./social-auth.core";
import {
  validateAndConsumeAdminInvite,
  markInviteUsedBy,
} from "../admin/admin-invite.service";
import { hashPassword, comparePassword } from "../../utils/auth/password";
import { resolveCafeOwnerLoginMeta } from "./cafe-owner-auth.meta";

export { resolveCafeOwnerLoginMeta } from "./cafe-owner-auth.meta";
export type {
  CafeOwnerLoginMeta,
  CafeOwnerRegistrationStatus,
  CafeOwnerRedirectTarget,
} from "./cafe-owner-auth.meta";

interface GoogleLoginPayload {
  token: string;
}

interface AppleLoginPayload {
  identityToken: string;
}

export type AuthResponse = AuthTokensResult;

export const googleLogin = async ({
  token,
}: GoogleLoginPayload): Promise<AuthResponse> => {
  logger.info("Google login attempt");
  const result = await loginWithProvider("google", token);
  logger.info(`Google login successful for user: ${result.user._id}`);
  return result;
};

export const appleLogin = async ({
  identityToken,
}: AppleLoginPayload): Promise<AuthResponse> => {
  logger.info("Apple login attempt");
  const result = await loginWithProvider("apple", undefined, identityToken);
  logger.info(`Apple login successful for user: ${result.user._id}`);
  return result;
};

export const getCurrentUser = async (userId: string): Promise<IUser | null> => {
  logger.info(`Fetching current user: ${userId}`);
  return await findUserById(userId);
};

export const changeProfile = async (
  userId: string,
  payload: UpdateProfilePayload,
): Promise<IUser | null> => {
  logger.info(`Updating profile: ${userId}`);

  const updateData: UpdateProfilePayload = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name.trim();
  }

  if (payload.phone !== undefined) {
    updateData.phone = payload.phone.trim();
  }

  if (payload.university !== undefined) {
    updateData.university = payload.university.trim();
  }

  if (payload.profileImage !== undefined) {
    updateData.profileImage = payload.profileImage;
  }

  return await updateProfileRepo(userId, updateData);
};

export const refreshTokens = async ({
  refreshToken,
}: RefreshTokenPayload): Promise<AuthResponse> => {
  if (!refreshToken) {
    throw new UnauthorizedError("Refresh token missing");
  }

  let decoded: {
    sub: string;
    sessionId: string;
    familyId: string;
  };

  try {
    decoded = verifyRefreshToken(refreshToken) as {
      sub: string;
      sessionId: string;
      familyId: string;
    };
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const user = await findUserById(decoded.sub);

  if (!user) {
    logger.warn(`Refresh token used for non-existent user: ${decoded.sub}`);
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (user.isBlocked) {
    logger.warn(`Blocked user attempted token refresh: ${user._id}`);
    throw new UnauthorizedError("Account blocked");
  }

  try {
    const tokens = await rotateRefreshToken(user, refreshToken, decoded);
    logger.info(`Token refreshed for user: ${user._id}`);
    return tokens;
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }
};

export const adminLogin = async ({
  email,
  password,
}: AdminEmailLoginPayload): Promise<AuthResponse> => {
  logger.info(`Admin email login attempt: ${email}`);

  const user = await findUserByEmailWithPassword(email);

  if (!user?.passwordHash) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = await authenticateUser(user, { expectedRole: "super_admin" });
  logger.info(`Admin email login successful for user: ${user._id}`);
  return tokens;
};

export const adminRegister = async ({
  name,
  email,
  password,
  inviteToken,
}: AdminEmailRegisterPayload): Promise<AuthResponse> => {
  logger.info(`Admin email registration attempt: ${email}`);

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await findUserByEmailWithPassword(normalizedEmail);

  if (existingUser) {
    throw new ConflictError("An account with this email already exists");
  }

  if (!inviteToken) {
    throw new UnauthorizedError(
      "Admin invite token is required for registration",
    );
  }

  await validateAndConsumeAdminInvite(inviteToken, normalizedEmail);

  const passwordHash = await hashPassword(password);
  const user = await createAdminEmailUser({
    name,
    email: normalizedEmail,
    passwordHash,
  });

  await markInviteUsedBy(inviteToken, user._id.toString());

  const tokens = await authenticateUser(user, { expectedRole: "super_admin" });
  logger.info(`Admin registered and logged in: ${user._id}`);
  return tokens;
};

export const adminSocialLogin = async ({
  provider,
  token,
  identityToken,
  inviteToken,
}: AdminLoginPayload): Promise<AuthResponse> => {
  logger.info(`Admin social login attempt via ${provider}`);

  const result = await loginAdminWithProvider(
    provider,
    token,
    identityToken,
    inviteToken,
  );

  logger.info(`Admin social login successful for user: ${result.user._id}`);
  return result;
};

export const cafeOwnerLogin = async ({
  provider,
  token,
  identityToken,
}: AdminLoginPayload): Promise<
  AuthResponse & { meta: Awaited<ReturnType<typeof resolveCafeOwnerLoginMeta>> }
> => {
  logger.info(`Cafe owner login attempt via ${provider}`);

  const result = await loginOrSignUpCafeOwnerWithProvider(
    provider,
    token,
    identityToken,
  );

  const meta = await resolveCafeOwnerLoginMeta(
    result.user._id.toString(),
    result.user.role,
  );

  logger.info(`Cafe owner login successful for user: ${result.user._id}`, {
    redirectTo: meta.redirectTo,
    cafeStatus: meta.cafeStatus,
  });

  return { ...result, meta };
};

export const logout = async (refreshToken?: string): Promise<void> => {
  await revokeRefreshToken(refreshToken);
  logger.info("User session revoked");
};
