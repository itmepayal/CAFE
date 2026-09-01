import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import logger from "../config/logger.config";
import { AppError } from "../utils/errors/app.error";

export const appErrorHandler: ErrorRequestHandler = (
  error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const appError = error as AppError;
  const statusCode =
    typeof appError?.statusCode === "number" ? appError.statusCode : 500;

  if (statusCode >= 500) {
    logger.error("Application error", {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      message: appError?.message,
      stack: (error as Error).stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: appError?.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: (error as Error).stack,
    }),
  });
};

export const genericErrorHandler: ErrorRequestHandler = (
  error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  logger.error("Unhandled error", {
    method: req.method,
    path: req.originalUrl,
    message: error.message,
    stack: error.stack,
  });

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      error: error.message,
      stack: error.stack,
    }),
  });
};
