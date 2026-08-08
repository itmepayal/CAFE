import crypto from "crypto";
import { IUser } from "../../models/user";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
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
  createAdminAppleUser,
  createAdminGoogleUser,
} from "./auth.repository";

import { logger } from "../../config/logger.config";

import {
  AdminLoginPayload,
  AdminRegisterPayload,
  RefreshTokenPayload,
  UpdateProfilePayload,
} from "./auth.type";

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
      name: googleUser.name ?? "User",
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

  if (!appleUser.email) {
    throw new UnauthorizedError("Email not provided by Apple");
  }

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

export const getCurrentUser = async (userId: string): Promise<IUser | null> => {
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

/**
 * =========================================================
 * REFRESH TOKENS
 * =========================================================
 */

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

  const accessToken = generateAccessToken(user);

  const { refreshToken: newRefreshToken } = generateRefreshToken({
    user,
    sessionId: crypto.randomUUID(),
    familyId: decoded.familyId,
  });

  logger.info(`Token refreshed for user: ${user._id}`);

  return {
    user,
    accessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * =========================================================
 * ADMIN LOGIN
 * =========================================================
 */

export const adminLogin = async ({
  provider,
  token,
  identityToken,
}: AdminLoginPayload): Promise<AuthResponse> => {
  logger.info(`Admin login attempt via ${provider}`);

  let result: AuthResponse;

  if (provider === "google") {
    if (!token) {
      throw new UnauthorizedError("Google token missing");
    }

    result = await googleLogin({ token });
  } else if (provider === "apple") {
    if (!identityToken) {
      throw new UnauthorizedError("Apple identity token missing");
    }

    result = await appleLogin({
      identityToken,
    });
  } else {
    throw new UnauthorizedError("Unsupported login provider");
  }

  if (result.user.role !== "super_admin") {
    logger.warn(`Non-admin attempted admin login: ${result.user._id}`);

    throw new UnauthorizedError("Admin access required");
  }

  logger.info(`Admin login successful for user: ${result.user._id}`);

  return result;
};

/**
 * =========================================================
 * ADMIN REGISTER
 * =========================================================
 */
export const adminRegister = async ({
  provider,
  token,
  identityToken,
}: AdminRegisterPayload): Promise<AuthResponse> => {
  logger.info(`Admin registration attempt via ${provider}`);

  let user: IUser | null = null;

  if (provider === "google") {
    if (!token) {
      throw new UnauthorizedError("Google token missing");
    }

    const googleUser = await verifyGoogleToken(token).catch((err) => {
      logger.warn(`Google token verification failed: ${err?.message}`);

      throw new UnauthorizedError("Invalid Google token");
    });

    if (!googleUser.email) {
      throw new UnauthorizedError("Email not provided by Google");
    }

    user = await findUserByProviderIdOrEmail(
      googleUser.providerId,
      googleUser.email,
    );

    if (user) {
      throw new UnauthorizedError("An account already exists with this email");
    }

    user = await createAdminGoogleUser({
      name: googleUser.name ?? "Admin",
      email: googleUser.email,
      profileImage: googleUser.profileImage,
      providerId: googleUser.providerId,
    });
  } else if (provider === "apple") {
    if (!identityToken) {
      throw new UnauthorizedError("Apple identity token missing");
    }

    const appleUser = await verifyAppleToken(identityToken).catch((err) => {
      logger.warn(`Apple token verification failed: ${err?.message}`);

      throw new UnauthorizedError("Invalid Apple token");
    });

    if (!appleUser.email) {
      throw new UnauthorizedError("Email not provided by Apple");
    }

    user = await findUserByProviderId(appleUser.providerId);

    if (user) {
      throw new UnauthorizedError("An account already exists");
    }

    user = await createAdminAppleUser({
      email: appleUser.email,
      providerId: appleUser.providerId,
    });
  } else {
    throw new UnauthorizedError("Unsupported login provider");
  }

  if (!user) {
    throw new UnauthorizedError("Admin registration failed");
  }

  const accessToken = generateAccessToken(user);

  const { refreshToken } = generateRefreshToken({
    user,
    sessionId: crypto.randomUUID(),
    familyId: crypto.randomUUID(),
  });

  logger.info(`Admin registration successful: ${user._id}`);

  return {
    user,
    accessToken,
    refreshToken,
  };
};
