import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { serverConfig } from "../config";
import { UnauthorizedError, ForbiddenError } from "../utils/errors/app.error";

/**
 * Protects Swagger UI + OpenAPI JSON in production.
 * Dev: open. Prod: requires SWAGGER_ACCESS_KEY via
 *   Authorization: Bearer <key>  OR  X-Swagger-Key: <key>
 */
export const swaggerAccessGuard = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (serverConfig.NODE_ENV !== "production") {
    next();
    return;
  }

  const configuredKey = process.env.SWAGGER_ACCESS_KEY?.trim();

  if (!configuredKey) {
    next(
      new ForbiddenError(
        "Swagger is disabled in production until SWAGGER_ACCESS_KEY is configured",
      ),
    );
    return;
  }

  const headerKey = req.header("x-swagger-key")?.trim();
  const auth = req.header("authorization");
  const bearerKey =
    auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : undefined;

  const provided = headerKey || bearerKey;

  if (!provided) {
    next(new UnauthorizedError("Swagger access key required"));
    return;
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(configuredKey);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    next(new ForbiddenError("Invalid Swagger access key"));
    return;
  }

  next();
};
