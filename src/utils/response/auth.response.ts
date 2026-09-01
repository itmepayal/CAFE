import { Response } from "express";
import { setAuthCookies } from "../cookies/cookie.utils";
import { AuthTokensResult } from "../../modules/auth/auth.tokens";

interface SendAuthResponseOptions {
  res: Response;
  message: string;
  tokens: AuthTokensResult;
  statusCode?: number;
}

/**
 * Sets httpOnly cookies (web) and returns tokens in body (mobile Bearer auth).
 */
export const sendAuthResponse = ({
  res,
  message,
  tokens,
  statusCode = 200,
}: SendAuthResponseOptions): void => {
  setAuthCookies(res, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: tokens.user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
};
