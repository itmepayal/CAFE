import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { serverConfig } from "../config";
import { UnauthorizedError } from "../utils/errors/app.error";

interface JwtPayload {
  sub: string;
  email?: string;
  role: string;
  provider: string;
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new UnauthorizedError("Authentication required");
    }

    const decoded = jwt.verify(
      token,
      serverConfig.JWT_ACCESS_SECRET,
    ) as JwtPayload;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      provider: decoded.provider,
    };

    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
};
