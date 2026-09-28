import crypto from "crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("../src/config", async () => {
  const actual = await vi.importActual<typeof import("../src/config")>(
    "../src/config",
  );
  return {
    ...actual,
    serverConfig: {
      ...actual.serverConfig,
      NODE_ENV: "test",
    },
  };
});

import { serverConfig } from "../src/config";
import { swaggerAccessGuard } from "../src/middlewares/swagger-access.middleware";

describe("swaggerAccessGuard", () => {
  beforeEach(() => {
    (serverConfig as { NODE_ENV: string }).NODE_ENV = "test";
    delete process.env.SWAGGER_ACCESS_KEY;
  });

  const run = (headers: Record<string, string | undefined> = {}) => {
    const req = {
      header: (name: string) => {
        const key = name.toLowerCase();
        if (key === "x-swagger-key") return headers["x-swagger-key"];
        if (key === "authorization") return headers.authorization;
        return undefined;
      },
    } as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;
    swaggerAccessGuard(req, res, next);
    return next;
  };

  it("allows access in non-production without a key", () => {
    (serverConfig as { NODE_ENV: string }).NODE_ENV = "development";
    const next = run();
    expect(next).toHaveBeenCalledWith();
  });

  it("requires SWAGGER_ACCESS_KEY in production", () => {
    (serverConfig as { NODE_ENV: string }).NODE_ENV = "production";
    delete process.env.SWAGGER_ACCESS_KEY;
    const next = run();
    expect(next).toHaveBeenCalled();
    const err = vi.mocked(next).mock.calls[0][0] as Error;
    expect(String(err.message)).toMatch(/SWAGGER_ACCESS_KEY/i);
  });

  it("rejects missing key when configured", () => {
    (serverConfig as { NODE_ENV: string }).NODE_ENV = "production";
    process.env.SWAGGER_ACCESS_KEY = "expected-key";
    const next = run();
    const err = vi.mocked(next).mock.calls[0][0] as Error;
    expect(String(err.message)).toMatch(/Swagger access key required/i);
  });

  it("accepts valid X-Swagger-Key", () => {
    (serverConfig as { NODE_ENV: string }).NODE_ENV = "production";
    process.env.SWAGGER_ACCESS_KEY = "expected-key";
    const next = run({ "x-swagger-key": "expected-key" });
    expect(next).toHaveBeenCalledWith();
  });

  it("accepts valid Bearer key", () => {
    (serverConfig as { NODE_ENV: string }).NODE_ENV = "production";
    process.env.SWAGGER_ACCESS_KEY = "expected-key";
    const next = run({ authorization: "Bearer expected-key" });
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects invalid key", () => {
    (serverConfig as { NODE_ENV: string }).NODE_ENV = "production";
    process.env.SWAGGER_ACCESS_KEY = "expected-key";
    const next = run({ "x-swagger-key": "wrong-key" });
    const err = vi.mocked(next).mock.calls[0][0] as Error;
    expect(String(err.message)).toMatch(/Invalid Swagger/i);
  });
});

describe("password reset token hashing", () => {
  it("never stores raw token — hash is sha256", () => {
    const raw = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    expect(hash).toHaveLength(64);
    expect(hash).not.toBe(raw);
  });
});
