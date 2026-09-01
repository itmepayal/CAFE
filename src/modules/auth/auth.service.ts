import { IUser } from "../../models/user";
import { verifyRefreshToken } from "../../utils/jwt/token.jwt";
import { UnauthorizedError } from "../../utils/errors/app.error";
import {
  findUserById,
  updateProfileRepo,
} from "./auth.repository";
import { logger } from "../../config/logger.config";
import {
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
  loginOrSignUpAdminWithProvider,
  loginOrSignUpCafeOwnerWithProvider,
} from "./social-auth.core";

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
  provider,
  token,
  identityToken,
}: AdminLoginPayload): Promise<AuthResponse> => {
  logger.info(`Admin login attempt via ${provider}`);

  const result = await loginOrSignUpAdminWithProvider(
    provider,
    token,
    identityToken,
  );

  logger.info(`Admin login successful for user: ${result.user._id}`);
  return result;
};

export const cafeOwnerLogin = async ({
  provider,
  token,
  identityToken,
}: AdminLoginPayload): Promise<AuthResponse> => {
  logger.info(`Cafe owner login attempt via ${provider}`);

  const result = await loginOrSignUpCafeOwnerWithProvider(
    provider,
    token,
    identityToken,
  );

  logger.info(`Cafe owner login successful for user: ${result.user._id}`);
  return result;
};

export const logout = async (refreshToken?: string): Promise<void> => {
  await revokeRefreshToken(refreshToken);
  logger.info("User session revoked");
};
