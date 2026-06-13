import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { IUser } from "../../models/user";
import { serverConfig } from "../../config";

/**
 * =========================================================
 * ACCESS TOKEN PAYLOAD
 * =========================================================
 */
interface AccessTokenPayload {
  sub: string;
  email?: string | null;
  role: string;
  provider: string;
}

/**
 * =========================================================
 * REFRESH TOKEN PAYLOAD
 * =========================================================
 */
interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  familyId: string;
  tokenVersion: number;
}

/**
 * =========================================================
 * GENERATE ACCESS TOKEN
 * =========================================================
 */
export const generateAccessToken = (user: IUser): string => {
  const payload: AccessTokenPayload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    provider: user.provider,
  };

  return jwt.sign(
    payload,
    serverConfig.JWT_ACCESS_SECRET as string,
    {
      expiresIn: serverConfig.JWT_ACCESS_EXPIRES || "15m",
      issuer: "auth-service",
      audience: "user",
    } as SignOptions,
  );
};

/**
 * =========================================================
 * GENERATE REFRESH TOKEN
 * =========================================================
 */

interface GenerateRefreshTokenOptions {
  user: IUser;
  sessionId: string;
  familyId: string;
}

export interface RefreshTokenResult {
  refreshToken: string;
  tokenHash: string;
}

export const generateRefreshToken = ({
  user,
  sessionId,
  familyId,
}: GenerateRefreshTokenOptions): RefreshTokenResult => {
  /**
   * =====================================================
   * JWT PAYLOAD
   * =====================================================
   */

  const payload: RefreshTokenPayload = {
    sub: user._id.toString(),
    sessionId,
    familyId,
    tokenVersion: 1,
  };

  /**
   * =====================================================
   * CREATE JWT REFRESH TOKEN
   * =====================================================
   */

  const refreshToken = jwt.sign(
    payload,
    serverConfig.JWT_REFRESH_SECRET as string,
    {
      expiresIn: serverConfig.JWT_REFRESH_EXPIRES || "30d",
      issuer: "auth-service",
      audience: "user",
    } as SignOptions,
  );

  /**
   * =====================================================
   * HASH TOKEN
   * NEVER SAVE RAW TOKEN
   * =====================================================
   */
  const tokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  return {
    refreshToken,

    tokenHash,
  };
};

/**
 * =========================================================
 * VERIFY ACCESS TOKEN
 * =========================================================
 */
export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, serverConfig.JWT_ACCESS_SECRET as string);
};

/**
 * =========================================================
 * VERIFY REFRESH TOKEN
 * =========================================================
 */
export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, serverConfig.JWT_REFRESH_SECRET as string);
};
