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
  /**
   * =========================================================
   * SUCCESS RESPONSE
   * =========================================================
   */
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode = 200,
    meta?: ApiMeta,
  ): Response {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data: data || null,
      meta: meta || null,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * =========================================================
   * ERROR RESPONSE
   * =========================================================
   */
  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: unknown,
  ): Response {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors: errors || null,
      timestamp: new Date().toISOString(),
    });
  }
}
