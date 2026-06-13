import { Response, CookieOptions } from "express";
import { serverConfig } from "../../config";

/**
 * =========================================================
 * COOKIE CONFIG
 * =========================================================
 */

const isProduction = serverConfig.NODE_ENV === "production";

/**
 * =========================================================
 * BASE COOKIE OPTIONS
 * =========================================================
 */

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict",
  path: "/",
};

/**
 * =========================================================
 * ACCESS TOKEN COOKIE OPTIONS
 * =========================================================
 */

export const accessTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,

  maxAge: 1000 * 60 * 15, // 15 MINUTES
};

/**
 * =========================================================
 * REFRESH TOKEN COOKIE OPTIONS
 * =========================================================
 */

export const refreshTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,

  maxAge: 1000 * 60 * 60 * 24 * 30,
};

/**
 * =========================================================
 * SET ACCESS TOKEN COOKIE
 * =========================================================
 */

export const setAccessTokenCookie = (res: Response, token: string): void => {
  res.cookie("accessToken", token, accessTokenCookieOptions);
};

/**
 * =========================================================
 * SET REFRESH TOKEN COOKIE
 * =========================================================
 */

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie("refreshToken", token, refreshTokenCookieOptions);
};

/**
 * =========================================================
 * SET AUTH COOKIES
 * =========================================================
 */

interface SetAuthCookiesPayload {
  accessToken: string;
  refreshToken: string;
}

export const setAuthCookies = (
  res: Response,
  payload: SetAuthCookiesPayload,
): void => {
  setAccessTokenCookie(res, payload.accessToken);
  setRefreshTokenCookie(res, payload.refreshToken);
};

/**
 * =========================================================
 * CLEAR ACCESS TOKEN COOKIE
 * =========================================================
 */

export const clearAccessTokenCookie = (res: Response): void => {
  res.clearCookie("accessToken", {
    ...baseCookieOptions,
  });
};

/**
 * =========================================================
 * CLEAR REFRESH TOKEN COOKIE
 * =========================================================
 */

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie("refreshToken", {
    ...baseCookieOptions,
  });
};

/**
 * =========================================================
 * CLEAR AUTH COOKIES
 * =========================================================
 */

export const clearAuthCookies = (res: Response): void => {
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);
};
