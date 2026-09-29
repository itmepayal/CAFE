/**
 * @file api.response.ts
 */

import { Response } from "express";

/**
 * =========================================================
 * API RESPONSE META INTERFACE
 * =========================================================
 */
interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

/**
 * =========================================================
 * STANDARD API RESPONSE
 * =========================================================
 */
export class ApiResponse {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode = 200,
    meta?: ApiMeta | null,
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data: data ?? null,
      meta: meta ?? null,
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: unknown,
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      data: null,
      meta: {
        code: (errors as any)?.name
          ? (errors as any).name.replace(/Error$/, "").replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase()
          : "INTERNAL_SERVER_ERROR",
        ...(errors && typeof errors === "object" ? { details: errors } : {}),
      },
    });
  }
}
