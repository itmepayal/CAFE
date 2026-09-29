import { Response } from "express";
import { setAuthCookies } from "../cookies/cookie.utils";
import { AuthTokensResult } from "../../modules/auth/auth.tokens";
import { serializePublicUser } from "./user.serializer";
import { ApiResponse } from "./app.response";

interface SendAuthResponseOptions {
  res: Response;
  message: string;
  tokens: AuthTokensResult;
  statusCode?: number;
  meta?: Record<string, unknown>;
}

/**
 * Sets httpOnly cookies (web) and returns tokens in body (mobile Bearer auth).
 */
export const sendAuthResponse = ({
  res,
  message,
  tokens,
  statusCode = 200,
  meta,
}: SendAuthResponseOptions): void => {
  setAuthCookies(res, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });

  const responseData = tokens.user ? {
    user: serializePublicUser(tokens.user),
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  } : {
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  };

  ApiResponse.success(res, message, responseData, statusCode, meta);
};
