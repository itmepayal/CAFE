import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { readFileSync } from "fs";
import path from "path";

vi.mock("../src/modules/auth/auth.repository", () => ({
  findUserAuthStatusById: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(),
  },
}));

vi.mock("../src/utils/auth/extract-token", () => ({
  extractAccessToken: vi.fn(),
}));

import jwt from "jsonwebtoken";
import { findUserAuthStatusById } from "../src/modules/auth/auth.repository";
import { authenticate } from "../src/middlewares/auth.middleware";
import { extractAccessToken } from "../src/utils/auth/extract-token";

describe("authenticate blocked/inactive enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const runAuth = async () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    vi.mocked(extractAccessToken).mockReturnValue("token");
    vi.mocked(jwt.verify).mockReturnValue({
      sub: "user1",
      role: "student",
      provider: "google",
    } as never);

    await authenticate(req, res, next);
    return { req, next };
  };

  it("rejects blocked users", async () => {
    vi.mocked(findUserAuthStatusById).mockResolvedValue({
      _id: { toString: () => "user1" },
      email: "a@b.com",
      role: "student",
      provider: "google",
      isBlocked: true,
      isActive: true,
    } as never);

    const { next } = await runAuth();
    expect(next).toHaveBeenCalled();
    const err = vi.mocked(next).mock.calls[0][0] as Error;
    expect(String(err.message)).toMatch(/blocked/i);
  });

  it("rejects inactive users", async () => {
    vi.mocked(findUserAuthStatusById).mockResolvedValue({
      _id: { toString: () => "user1" },
      email: "a@b.com",
      role: "student",
      provider: "google",
      isBlocked: false,
      isActive: false,
    } as never);

    const { next } = await runAuth();
    const err = vi.mocked(next).mock.calls[0][0] as Error;
    expect(String(err.message)).toMatch(/deactivated/i);
  });

  it("allows active unblocked users", async () => {
    vi.mocked(findUserAuthStatusById).mockResolvedValue({
      _id: { toString: () => "user1" },
      email: "a@b.com",
      role: "student",
      provider: "google",
      isBlocked: false,
      isActive: true,
    } as never);

    const { req, next } = await runAuth();
    expect(next).toHaveBeenCalledWith();
    expect(req.user?.id).toBe("user1");
  });
});

describe("permissions helper", () => {
  it("grants super_admin refund permission", async () => {
    const { roleHasPermission, PERMISSIONS } = await import(
      "../src/utils/auth/permissions"
    );
    expect(roleHasPermission("super_admin", PERMISSIONS.ADMIN_REFUND)).toBe(
      true,
    );
    expect(roleHasPermission("student", PERMISSIONS.ADMIN_REFUND)).toBe(false);
  });
});

describe("socket recovery config", () => {
  it("does not skip auth middlewares on connection recovery", () => {
    const src = readFileSync(
      path.join(__dirname, "../src/socket/socket.ts"),
      "utf8",
    );
    expect(src).toContain("skipMiddlewares: false");
  });
});
