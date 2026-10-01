import { describe, expect, it, vi, beforeEach } from "vitest";
import crypto from "crypto";

vi.mock("../src/models/user", () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
  },
}));

vi.mock("../src/models/cafe", () => ({ default: { findOne: vi.fn() } }));



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
import Cafe from "../src/models/cafe";
import { revokeAllSessionsForUser } from "../src/modules/auth/session.repository";
import {
  logoutAll,
  deleteAccount,
} from "../src/modules/auth/auth.service";



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
    vi.mocked(Cafe.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    } as never);
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

  it.each(["pending", "approved"])("prevents deletion when a %s cafe is linked by userId", async (status) => {
    const user = {
      _id: { toString: () => "owner1" }, role: status === "approved" ? "cafe_owner" : "student",
      ownedCafe: null, save: vi.fn(), set: vi.fn(),
    };
    vi.mocked(User.findById).mockReturnValue({ select: vi.fn().mockResolvedValue(user) } as never);
    vi.mocked(Cafe.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: "cafe1", status }) }),
    } as never);
    await expect(deleteAccount("owner1")).rejects.toThrow(/Cafe owners must/i);
    expect(user.save).not.toHaveBeenCalled();
  });

  it("allows deletion when no cafe is linked", async () => {
    const user = {
      _id: { toString: () => "student1" }, role: "student", ownedCafe: null,
      name: "Alice", email: "alice@example.com", set: vi.fn(), save: vi.fn(),
    };
    vi.mocked(User.findById).mockReturnValue({ select: vi.fn().mockResolvedValue(user) } as never);
    vi.mocked(Cafe.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    } as never);
    vi.mocked(revokeAllSessionsForUser).mockResolvedValue(1);
    await expect(deleteAccount("student1")).resolves.toBeDefined();
    expect(user.save).toHaveBeenCalledOnce();
  });
});
