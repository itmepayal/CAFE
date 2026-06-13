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
} from "./auth.repository";

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
  const googleUser = await verifyGoogleToken(token).catch(() => {
    throw new UnauthorizedError("Invalid Google token");
  });

  let user = await findUserByProviderIdOrEmail(
    googleUser.providerId,
    googleUser.email,
  );

  if (!user) {
    user = await createGoogleUser({
      name: googleUser.name,
      email: googleUser.email,
      profileImage: googleUser.profileImage,
      providerId: googleUser.providerId,
    });
  }

  if (user.isBlocked) {
    throw new UnauthorizedError("Account blocked");
  }

  user = await updateUserSession(user);

  const accessToken = generateAccessToken(user);

  const { refreshToken } = generateRefreshToken({
    user,
    sessionId: crypto.randomUUID(),
    familyId: crypto.randomUUID(),
  });

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
  const appleUser = await verifyAppleToken(identityToken).catch(() => {
    throw new UnauthorizedError("Invalid Apple token");
  });

  let user = await findUserByProviderId(appleUser.providerId);

  if (!user) {
    user = await createAppleUser({
      email: appleUser.email,
      providerId: appleUser.providerId,
    });
  }

  if (user.isBlocked) {
    throw new UnauthorizedError("Account blocked");
  }

  user = await updateUserSession(user);

  const accessToken = generateAccessToken(user);

  const { refreshToken } = generateRefreshToken({
    user,
    sessionId: crypto.randomUUID(),
    familyId: crypto.randomUUID(),
  });

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
  return await findUserById(userId);
};
