import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { serverConfig } from "../config";
import { UnauthorizedError, ForbiddenError } from "../utils/errors/app.error";

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

type Role = "student" | "cafe_owner" | "admin" | "super_admin";

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role | undefined;

    if (!userRole) {
      throw new UnauthorizedError("No role found");
    }

    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenError("Access denied");
    }

    next();
  };
};
