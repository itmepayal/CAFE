import { describe, expect, it, vi, beforeEach } from "vitest";
import crypto from "crypto";

vi.mock("../src/models/user", () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock("../src/models/password-reset-token", () => ({
  default: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock("../src/modules/auth/session.repository", () => ({
  revokeAllSessionsForUser: vi.fn(),
}));

vi.mock("../src/utils/auth/password", () => ({
  hashPassword: vi.fn(async (p: string) => `hashed:${p}`),
  comparePassword: vi.fn(),
}));

vi.mock("../src/config/logger.config", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import User from "../src/models/user";
import PasswordResetToken from "../src/models/password-reset-token";
import { revokeAllSessionsForUser } from "../src/modules/auth/session.repository";
import {
  forgotPassword,
  resetPassword,
  logoutAll,
  deleteAccount,
} from "../src/modules/auth/auth.service";

describe("forgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns generic message for unknown email (anti-enumeration)", async () => {
    vi.mocked(User.findOne).mockReturnValue({
      select: vi.fn().mockResolvedValue(null),
    } as never);

    const result = await forgotPassword("nobody@example.com");
    expect(result.message).toMatch(/If an account exists/i);
    expect(PasswordResetToken.create).not.toHaveBeenCalled();
  });

  it("creates hashed token for email/password users", async () => {
    const user = {
      _id: { toString: () => "uid1" },
      email: "admin@example.com",
      passwordHash: "hash",
      provider: "email",
      isBlocked: false,
      isActive: true,
    };

    vi.mocked(User.findOne).mockReturnValue({
      select: vi.fn().mockResolvedValue(user),
    } as never);
    vi.mocked(PasswordResetToken.deleteMany).mockResolvedValue({} as never);
    vi.mocked(PasswordResetToken.create).mockResolvedValue({} as never);

    const result = await forgotPassword("admin@example.com");
    expect(result.message).toMatch(/If an account exists/i);
    expect(PasswordResetToken.create).toHaveBeenCalled();
    const created = vi.mocked(PasswordResetToken.create).mock.calls[0][0] as {
      tokenHash: string;
    };
    expect(created.tokenHash).toHaveLength(64);
  });
});

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid token", async () => {
    vi.mocked(PasswordResetToken.findOne).mockResolvedValue(null);
    await expect(
      resetPassword({ token: "a".repeat(64), password: "NewPass123" }),
    ).rejects.toThrow(/Invalid or expired/i);
  });

  it("updates password, marks token used, revokes sessions", async () => {
    const raw = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");

    const record = {
      userId: "uid1",
      tokenHash,
      usedAt: null,
      save: vi.fn(),
    };

    const user = {
      _id: { toString: () => "uid1" },
      isActive: true,
      isBlocked: false,
      passwordHash: "old",
      save: vi.fn(),
    };

    vi.mocked(PasswordResetToken.findOne).mockResolvedValue(record as never);
    vi.mocked(User.findById).mockReturnValue({
      select: vi.fn().mockResolvedValue(user),
    } as never);
    vi.mocked(PasswordResetToken.updateMany).mockResolvedValue({} as never);
    vi.mocked(revokeAllSessionsForUser).mockResolvedValue(2);

    const result = await resetPassword({
      token: raw,
      password: "NewPass123",
    });

    expect(result.message).toMatch(/Password updated/i);
    expect(user.passwordHash).toBe("hashed:NewPass123");
    expect(record.usedAt).toBeInstanceOf(Date);
    expect(revokeAllSessionsForUser).toHaveBeenCalledWith("uid1");
  });
});

describe("logoutAll", () => {
  it("revokes all sessions for user", async () => {
    vi.mocked(revokeAllSessionsForUser).mockResolvedValue(3);
    const result = await logoutAll("user-abc");
    expect(result.revoked).toBe(3);
    expect(revokeAllSessionsForUser).toHaveBeenCalledWith("user-abc");
  });
});

describe("deleteAccount anonymization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("anonymizes student and revokes sessions", async () => {
    const user = {
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      role: "student",
      ownedCafe: null,
      name: "Alice",
      email: "alice@example.com",
      phone: "9999999999",
      profileImage: "pic",
      providerId: "google-1",
      deviceTokens: [{ token: "t", platform: "web" }],
      favoriteCafes: ["cafe1"],
      university: "U",
      hostel: "H",
      adminNote: "",
      isActive: true,
      isBlocked: false,
      set: vi.fn(),
      save: vi.fn(),
    };

    vi.mocked(User.findById).mockReturnValue({
      select: vi.fn().mockResolvedValue(user),
    } as never);
    vi.mocked(revokeAllSessionsForUser).mockResolvedValue(1);
    vi.mocked(PasswordResetToken.deleteMany).mockResolvedValue({} as never);

    const result = await deleteAccount("507f1f77bcf86cd799439011");

    expect(result.message).toMatch(/Account deleted/i);
    expect(user.name).toBe("Deleted User");
    expect(user.email).toMatch(/^deleted_507f1f77bcf86cd799439011@/);
    expect(user.isActive).toBe(false);
    expect(user.isBlocked).toBe(true);
    expect(user.phone).toBeNull();
    expect(revokeAllSessionsForUser).toHaveBeenCalled();
  });

  it("blocks cafe owner with owned cafe", async () => {
    const user = {
      _id: { toString: () => "owner1" },
      role: "cafe_owner",
      ownedCafe: "cafe123",
    };

    vi.mocked(User.findById).mockReturnValue({
      select: vi.fn().mockResolvedValue(user),
    } as never);

    await expect(deleteAccount("owner1")).rejects.toThrow(/Cafe owners must/i);
  });
});
