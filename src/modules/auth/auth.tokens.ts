import crypto from "crypto";
import { IUser } from "../../models/user";
import { serverConfig } from "../../config";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../utils/jwt/token.jwt";
import {
  createSession,
  findActiveSessionByTokenHash,
  revokeSessionByTokenHash,
  revokeSessionFamily,
} from "./session.repository";

export interface AuthTokensResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

const hashRefreshToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const getRefreshTokenExpiry = (): Date => {
  const expires = serverConfig.JWT_REFRESH_EXPIRES || "30d";
  const match = expires.match(/^(\d+)([smhd])$/);

  if (!match) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const value = Number.parseInt(match[1], 10);
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * (unitMs[match[2]] ?? unitMs.d));
};

export const issueAuthTokens = async (user: IUser): Promise<AuthTokensResult> => {
  const sessionId = crypto.randomUUID();
  const familyId = crypto.randomUUID();
  const accessToken = generateAccessToken(user);
  const { refreshToken, tokenHash } = generateRefreshToken({
    user,
    sessionId,
    familyId,
  });

  await createSession({
    userId: user._id.toString(),
    sessionId,
    familyId,
    tokenHash,
    expiresAt: getRefreshTokenExpiry(),
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const rotateRefreshToken = async (
  user: IUser,
  refreshToken: string,
  decoded: { sessionId: string; familyId: string },
): Promise<AuthTokensResult> => {
  const tokenHash = hashRefreshToken(refreshToken);
  const session = await findActiveSessionByTokenHash(tokenHash);

  if (!session) {
    await revokeSessionFamily(decoded.familyId);
    throw new Error("Invalid refresh token session");
  }

  await revokeSessionByTokenHash(tokenHash);

  const newSessionId = crypto.randomUUID();
  const accessToken = generateAccessToken(user);
  const { refreshToken: newRefreshToken, tokenHash: newTokenHash } =
    generateRefreshToken({
      user,
      sessionId: newSessionId,
      familyId: decoded.familyId,
    });

  await createSession({
    userId: user._id.toString(),
    sessionId: newSessionId,
    familyId: decoded.familyId,
    tokenHash: newTokenHash,
    expiresAt: getRefreshTokenExpiry(),
  });

  return {
    user,
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const revokeRefreshToken = async (
  refreshToken?: string,
): Promise<void> => {
  if (!refreshToken) {
    return;
  }

  await revokeSessionByTokenHash(hashRefreshToken(refreshToken));
};
