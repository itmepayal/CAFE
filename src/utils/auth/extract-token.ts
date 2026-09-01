import { Request } from "express";

export const extractAccessToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return req.cookies?.accessToken;
};

export const extractRefreshToken = (req: Request): string | undefined => {
  return req.cookies?.refreshToken ?? req.body?.refreshToken;
};
