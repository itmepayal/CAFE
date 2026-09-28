import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { serverConfig } from "../config";
import { UnauthorizedError, ForbiddenError } from "../utils/errors/app.error";
import { extractAccessToken } from "../utils/auth/extract-token";
import { findUserAuthStatusById } from "../modules/auth/auth.repository";

interface JwtPayload {
  sub: string;
  email?: string;
  role: string;
  provider: string;
}

/** Single source of truth — matches User.role enum */
export type AppRole = "student" | "cafe_owner" | "super_admin";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = extractAccessToken(req);

    if (!token) {
      throw new UnauthorizedError("Authentication required");
    }

    const decoded = jwt.verify(
      token,
      serverConfig.JWT_ACCESS_SECRET,
    ) as JwtPayload;

    const user = await findUserAuthStatusById(decoded.sub);

    if (!user) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    if (!user.isActive) {
      throw new ForbiddenError("Account is deactivated");
    }

    if (user.isBlocked) {
      throw new ForbiddenError("Account is blocked");
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      provider: user.provider,
    };

    next();
  } catch (error) {
    if (error instanceof ForbiddenError || error instanceof UnauthorizedError) {
      next(error);
      return;
    }

    next(new UnauthorizedError("Invalid or expired token"));
  }
};

export const authorize = (...allowedRoles: AppRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userRole = req.user?.role as AppRole | undefined;

    if (!userRole) {
      return next(new UnauthorizedError("No role found"));
    }

    if (userRole === "super_admin") {
      return next();
    }

    if (!allowedRoles.includes(userRole)) {
      return next(new ForbiddenError("Access denied"));
    }

    next();
  };
};
