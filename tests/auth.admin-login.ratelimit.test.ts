import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { authRateLimiter } from "../src/middlewares/rate-limit.middleware";

describe("admin login brute-force protection", () => {
  it("limits repeated authentication attempts to 20 per 15-minute window per client", async () => {
    const ip = "203.0.113.42";
    await authRateLimiter.resetKey(ip);

    const statuses: number[] = [];
    for (let index = 0; index < 21; index += 1) {
      const req = {
        ip,
        method: "POST",
        originalUrl: "/auth/admin/login",
        headers: {},
        app: { get: () => false },
      } as unknown as Request;
      let status = 200;
      let finish!: () => void;
      const completed = new Promise<void>((resolve) => { finish = resolve; });
      const res = {
        headersSent: false,
        writableEnded: false,
        setHeader: vi.fn(),
        status(code: number) { status = code; return this; },
        send() { this.writableEnded = true; finish(); return this; },
      } as unknown as Response;
      const next = (() => finish()) as NextFunction;

      authRateLimiter(req, res, next);
      await completed;
      statuses.push(status);
    }

    expect(statuses.filter((status) => status === 429)).toHaveLength(1);
    expect(statuses.filter((status) => status === 200)).toHaveLength(20);
    await authRateLimiter.resetKey(ip);
  });
});
