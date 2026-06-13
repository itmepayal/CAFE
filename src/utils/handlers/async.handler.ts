import { Request, Response, NextFunction } from "express";

/**
 * =========================================================
 * ASYNC HANDLER
 * =========================================================
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
