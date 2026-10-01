import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import logger from "../config/logger.config";
import { AppError } from "../utils/errors/app.error";
import multer from "multer";

type NormalizedError = AppError;

const sensitiveKeyPattern = /(password|token|secret|account|ifsc|aadhar|aadhaar|pan|cookie|authorization|private.?key|document|passbook|gst)/i;

const redactErrorText = (text: string | undefined, req: Request): string | undefined => {
  if (!text) return text;
  const sensitiveValues: string[] = [];
  const visit = (value: unknown, key = ""): void => {
    if (typeof value === "string") {
      if (sensitiveKeyPattern.test(key) && value.length >= 4) sensitiveValues.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, key));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([childKey, child]) => visit(child, childKey));
    }
  };
  visit(req.body);
  [
    req.headers.authorization,
    req.headers.cookie,
    process.env.MONGODB_URI,
    process.env.JWT_ACCESS_SECRET,
    process.env.JWT_REFRESH_SECRET,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET,
    process.env.CASHFREE_SECRET_KEY,
  ].forEach((value) => {
    if (value && value.length >= 4) sensitiveValues.push(value);
  });
  return sensitiveValues.reduce(
    (result, secret) => result.split(secret).join("[REDACTED]"),
    text,
  );
};

const describeThrownValue = (error: unknown): string | undefined => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  if (typeof error === "string") return error;
  if (error === undefined) return undefined;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const normalizeKnownError = (error: unknown): NormalizedError | null => {
  const value = error as {
    name?: string;
    code?: string | number;
    keyPattern?: Record<string, number>;
    message?: string;
  };

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return { statusCode: 413, name: "PayloadTooLargeError", message: "Uploaded file exceeds the 5 MB limit" };
    }
    const message = error.code === "LIMIT_UNEXPECTED_FILE"
      ? "Unexpected upload field"
      : error.code === "LIMIT_FILE_COUNT"
        ? "Too many uploaded files"
        : "Invalid multipart upload";
    return { statusCode: 400, name: "BadRequestError", message };
  }

  if (value?.code === 11000) {
    const cafeOwnerDuplicate = value.keyPattern?.userId === 1;
    return {
      statusCode: 409,
      name: "ConflictError",
      message: cafeOwnerDuplicate ? "Cafe already registered for this user" : "Duplicate record",
    };
  }
  if (value?.name === "ValidationError") {
    return { statusCode: 400, name: "BadRequestError", message: "Invalid request data" };
  }
  if (value?.name === "CastError") {
    return { statusCode: 400, name: "BadRequestError", message: "Invalid request value" };
  }
  if (["MongooseServerSelectionError", "MongoServerSelectionError", "MongoNetworkError", "MongoNotConnectedError"].includes(value?.name ?? "")) {
    return { statusCode: 503, name: "ServiceUnavailableError", message: "Database unavailable" };
  }
  if (value?.name === "MongoServerError" && [6, 7, 89, 91, 189, 9001, 10107, 11600, 11602, 13435, 13436].includes(Number(value.code))) {
    return { statusCode: 503, name: "ServiceUnavailableError", message: "Database unavailable" };
  }
  return null;
};

export const appErrorHandler: ErrorRequestHandler = (
  error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const normalizedError = normalizeKnownError(error);
  const appError = (normalizedError ?? error) as AppError;
  const statusCode =
    typeof appError?.statusCode === "number" ? appError.statusCode : 500;

  if (statusCode >= 500) {
    const original = error as Error & { code?: string | number; name?: string; message?: string };
    logger.error("Application error", {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      errorName: original?.name ?? appError?.name,
      errorCode: original?.code,
      message: redactErrorText(describeThrownValue(error) ?? appError?.message, req),
      stack: redactErrorText(original?.stack, req),
    });
  }

  const productionInternalError = process.env.NODE_ENV === "production" && statusCode >= 500 && statusCode < 502;
  const responseMessage = productionInternalError
    ? "Internal Server Error"
    : appError?.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: responseMessage,
    data: null,
    meta: {
      code: appError?.name
        ? appError.name.replace(/Error$/, "").replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()
        : "INTERNAL_SERVER_ERROR",
    },
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
    errorName: error?.name,
    errorCode: (error as Error & { code?: string | number })?.code,
    message: redactErrorText(describeThrownValue(error), req),
    stack: redactErrorText(error instanceof Error ? error.stack : undefined, req),
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
