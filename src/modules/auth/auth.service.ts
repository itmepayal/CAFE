import crypto from "crypto";
import { IUser } from "../../models/user";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwt/token.jwt";
import { verifyGoogleToken } from "../../providers/google.provider";
import { verifyAppleToken } from "../../providers/apple.provider";
import { UnauthorizedError } from "../../utils/errors/app.error";
import {
  findUserByProviderIdOrEmail,
  findUserByProviderId,
  findUserById,
  createGoogleUser,
  createAppleUser,
  updateUserSession,
  updateProfileRepo,
} from "./auth.repository";
import { logger } from "../../config/logger.config";
import { UpdateProfilePayload } from "./auth.type";

/**
 * =========================================================
 * GOOGLE LOGIN PAYLOAD
 * =========================================================
 */
interface GoogleLoginPayload {
  token: string;
}

/**
 * =========================================================
 * APPLE LOGIN PAYLOAD
 * =========================================================
 */
interface AppleLoginPayload {
  identityToken: string;
}

/**
 * =========================================================
 * AUTH RESPONSE
 * =========================================================
 */
interface AuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * =========================================================
 * GOOGLE LOGIN SERVICE
 * =========================================================
 */
export const googleLogin = async ({
  token,
}: GoogleLoginPayload): Promise<AuthResponse> => {
  logger.info("Google login attempt");

  const googleUser = await verifyGoogleToken(token).catch((err) => {
    logger.warn(`Google token verification failed: ${err?.message}`);
    throw new UnauthorizedError("Invalid Google token");
  });

  let user = await findUserByProviderIdOrEmail(
    googleUser.providerId,
    googleUser.email,
  );

  if (!user) {
    logger.info(`Creating new user via Google login: ${googleUser.email}`);
    user = await createGoogleUser({
      name: googleUser.name,
      email: googleUser.email,
      profileImage: googleUser.profileImage,
      providerId: googleUser.providerId,
    });
  }

  if (user.isBlocked) {
    logger.warn(`Blocked user attempted Google login: ${user._id}`);
    throw new UnauthorizedError("Account blocked");
  }

  user = await updateUserSession(user);

  const accessToken = generateAccessToken(user);

  const { refreshToken } = generateRefreshToken({
    user,
    sessionId: crypto.randomUUID(),
    familyId: crypto.randomUUID(),
  });

  logger.info(`Google login successful for user: ${user._id}`);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * =========================================================
 * APPLE LOGIN SERVICE
 * =========================================================
 */
export const appleLogin = async ({
  identityToken,
}: AppleLoginPayload): Promise<AuthResponse> => {
  logger.info("Apple login attempt");

  const appleUser = await verifyAppleToken(identityToken).catch((err) => {
    logger.warn(`Apple token verification failed: ${err?.message}`);
    throw new UnauthorizedError("Invalid Apple token");
  });

  let user = await findUserByProviderId(appleUser.providerId);

  if (!user) {
    logger.info(`Creating new user via Apple login: ${appleUser.email}`);
    user = await createAppleUser({
      email: appleUser.email,
      providerId: appleUser.providerId,
    });
  }

  if (user.isBlocked) {
    logger.warn(`Blocked user attempted Apple login: ${user._id}`);
    throw new UnauthorizedError("Account blocked");
  }

  user = await updateUserSession(user);

  const accessToken = generateAccessToken(user);

  const { refreshToken } = generateRefreshToken({
    user,
    sessionId: crypto.randomUUID(),
    familyId: crypto.randomUUID(),
  });

  logger.info(`Apple login successful for user: ${user._id}`);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * =========================================================
 * GET CURRENT USER
 * =========================================================
 */
export const getCurrentUser = async (userId: string): Promise<IUser> => {
  logger.info(`Fetching current user: ${userId}`);

  return await findUserById(userId);
};

/**
 * =========================================================
 * CHANGE CURRENT USER
 * =========================================================
 */
export const changeProfile = async (
  userId: string,
  payload: UpdateProfilePayload,
): Promise<IUser> => {
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
