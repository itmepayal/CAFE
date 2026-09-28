import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";
import logger from "../config/logger.config";

const REQUEST_ID_HEADER = "x-request-id";
const SAFE_ID = /^[a-zA-Z0-9_-]{8,128}$/;

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const incoming = req.header(REQUEST_ID_HEADER);
  const requestId =
    incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
};

export const accessLogMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const started = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - started;
    const userId = req.user?.id;

    logger.info("HTTP request", {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl?.split("?")[0],
      statusCode: res.statusCode,
      durationMs,
      ...(userId ? { userId } : {}),
    });
  });

  next();
};
