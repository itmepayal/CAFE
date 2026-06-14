import { ErrorRequestHandler, NextFunction, Request, Response } from "express";

export const appErrorHandler: ErrorRequestHandler = (
  error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode =
    typeof (error as any)?.statusCode === "number"
      ? (error as any).statusCode
      : 500;

  res.status(statusCode).json({
    success: false,
    message: (error as any)?.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: (error as Error).stack,
    }),
  });
};

export const genericErrorHandler: ErrorRequestHandler = (
  error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Unhandled Error:", error);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      error: error.message,
      stack: error.stack,
    }),
  });
};
