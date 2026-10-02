import { describe, expect, it, vi, beforeEach } from "vitest";
import crypto from "crypto";
import mongoose from "mongoose";

vi.mock("../src/models/user", () => ({
  default: {
    create: vi.fn(),
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

vi.mock("../src/providers/google.provider", () => ({
  verifyGoogleToken: vi.fn(),
}));

vi.mock("../src/providers/apple.provider", () => ({
  verifyAppleToken: vi.fn(),
}));

vi.mock("../src/modules/auth/auth.tokens", () => ({
  issueAuthTokens: vi.fn(async (user) => ({
    user,
    accessToken: "access-token",
    refreshToken: "refresh-token",
  })),
  rotateRefreshToken: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

vi.mock("../src/config/logger.config", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import User from "../src/models/user";
import Cafe from "../src/models/cafe";
import { verifyGoogleToken } from "../src/providers/google.provider";
import { verifyAppleToken } from "../src/providers/apple.provider";
import { issueAuthTokens } from "../src/modules/auth/auth.tokens";
import { AccountDeletedError } from "../src/utils/errors/app.error";
import { revokeAllSessionsForUser } from "../src/modules/auth/session.repository";
import {
  logoutAll,
  deleteAccount,
} from "../src/modules/auth/auth.service";
import { loginOrSignUpCafeOwnerWithProvider } from "../src/modules/auth/social-auth.core";



describe("logoutAll", () => {
  it("revokes all sessions for user", async () => {
    vi.mocked(revokeAllSessionsForUser).mockResolvedValue(3);
    const result = await logoutAll("user-abc");
    expect(result.revoked).toBe(3);
    expect(revokeAllSessionsForUser).toHaveBeenCalledWith("user-abc");
  });
});

describe("deleteAccount anonymization", () => {
  let deletionSession: { withTransaction: (callback: () => Promise<unknown>) => Promise<unknown>; endSession: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    vi.clearAllMocks();
    deletionSession = {
      withTransaction: async (callback) => callback(),
      endSession: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(mongoose, "startSession").mockResolvedValue(deletionSession as never);
    vi.mocked(Cafe.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
      }),
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
      deletedAt: null,
      set: vi.fn(),
      save: vi.fn(),
    };

    vi.mocked(User.findById).mockReturnValue({
      select: vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(user) }),
    } as never);
    vi.mocked(revokeAllSessionsForUser).mockResolvedValue(1);

    const result = await deleteAccount("507f1f77bcf86cd799439011");

    expect(result.message).toMatch(/Account deleted/i);
    expect(user.name).toBe("Deleted User");
    expect(user.email).toMatch(/^deleted_507f1f77bcf86cd799439011@/);
    expect(user.providerId).toBe("google-1");
    expect(user.deletedAt).toBeInstanceOf(Date);
    expect(user.isActive).toBe(false);
    expect(user.isBlocked).toBe(true);
    expect(user.phone).toBeNull();
    expect(user.deviceTokens).toEqual([]);
    expect(user.favoriteCafes).toEqual([]);
    expect(user.university).toBe("");
    expect(user.hostel).toBe("");
    expect(user.set).toHaveBeenCalledWith("passwordHash", null);
    expect(user.save).toHaveBeenCalledWith({ session: deletionSession });
    expect(revokeAllSessionsForUser).toHaveBeenCalledWith("507f1f77bcf86cd799439011", deletionSession);
  });

  it.each([
    ["google", "google-stable-subject", "alice@example.com"],
    ["apple", "apple-stable-subject", "alice@privaterelay.appleid.com"],
  ] as const)(
    "keeps the %s OAuth tombstone across login → deletion → login",
    async (provider, providerId, email) => {
    const user = {
      _id: { toString: () => "507f1f77bcf86cd799439012" },
      role: "student",
      provider,
      providerId,
      ownedCafe: null,
      name: "Alice",
      email,
      phone: null,
      profileImage: "",
      deviceTokens: [],
      favoriteCafes: [],
      university: "",
      hostel: "",
      adminNote: "",
      isActive: true,
      isBlocked: false,
      deletedAt: null,
      loginCount: 0,
      lastLoginAt: null,
      set: vi.fn(),
      save: vi.fn().mockImplementation(async () => user),
    };
    vi.mocked(User.findById).mockReturnValue({
      select: vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(user) }),
    } as never);
    vi.mocked(User.findOne).mockImplementation(((query: { provider: string; providerId: string }) =>
      Promise.resolve(
        query.provider === user.provider && query.providerId === user.providerId
          ? user
          : null,
      )) as never);
    if (provider === "google") {
      vi.mocked(verifyGoogleToken).mockResolvedValue({
        providerId,
        email,
        emailVerified: true,
      } as any);
    } else {
      vi.mocked(verifyAppleToken).mockResolvedValue({
        providerId,
        email,
        emailVerified: true,
      } as any);
    }

    const login = () => loginOrSignUpCafeOwnerWithProvider(
      provider,
      provider === "google" ? "valid-google-token" : undefined,
      provider === "apple" ? "valid-apple-token" : undefined,
    );

    await expect(login()).resolves.toMatchObject({ user });
    expect(issueAuthTokens).toHaveBeenCalledOnce();
    vi.mocked(issueAuthTokens).mockClear();

    await deleteAccount("507f1f77bcf86cd799439012");

    await expect(login()).rejects.toMatchObject({
      name: AccountDeletedError.name,
      statusCode: 403,
    });

    expect(user.providerId).toBe(providerId);
    expect(user.deletedAt).toBeInstanceOf(Date);
    expect(User.create).not.toHaveBeenCalled();
    expect(issueAuthTokens).not.toHaveBeenCalled();
    },
  );

  it("blocks cafe owner with owned cafe", async () => {
    const user = {
      _id: { toString: () => "owner1" },
      role: "cafe_owner",
      ownedCafe: "cafe123",
    };

    vi.mocked(User.findById).mockReturnValue({
      select: vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(user) }),
    } as never);

    await expect(deleteAccount("owner1")).rejects.toThrow(/Cafe owners must/i);
  });

  it.each(["pending", "approved"])("prevents deletion when a %s cafe is linked by userId", async (status) => {
    const user = {
      _id: { toString: () => "owner1" }, role: status === "approved" ? "cafe_owner" : "student",
      ownedCafe: null, save: vi.fn(), set: vi.fn(),
    };
    vi.mocked(User.findById).mockReturnValue({
      select: vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(user) }),
    } as never);
    vi.mocked(Cafe.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: "cafe1", status }) }),
      }),
    } as never);
    await expect(deleteAccount("owner1")).rejects.toThrow(/Cafe owners must/i);
    expect(user.save).not.toHaveBeenCalled();
  });

  it("allows deletion when no cafe is linked", async () => {
    const user = {
      _id: { toString: () => "student1" }, role: "student", ownedCafe: null,
      name: "Alice", email: "alice@example.com", set: vi.fn(), save: vi.fn(),
    };
    vi.mocked(User.findById).mockReturnValue({
      select: vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(user) }),
    } as never);
    vi.mocked(Cafe.findOne).mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
      }),
    } as never);
    vi.mocked(revokeAllSessionsForUser).mockResolvedValue(1);
    await expect(deleteAccount("student1")).resolves.toBeDefined();
    expect(user.save).toHaveBeenCalledOnce();
  });

  it("safely handles a repeated deletion request by preserving the anonymized tombstone", async () => {
    const user = {
      _id: { toString: () => "student-repeated" }, role: "student", ownedCafe: null,
      name: "Deleted User", email: "deleted_student-repeated@anonymized.local",
      phone: null, profileImage: "", deletedAt: new Date(), isActive: false, isBlocked: true,
      deviceTokens: [], favoriteCafes: [], university: "", hostel: "", adminNote: "",
      set: vi.fn(), save: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(User.findById).mockReturnValue({
      select: vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(user) }),
    } as never);

    await expect(deleteAccount("student-repeated")).resolves.toMatchObject({ message: expect.stringMatching(/Account deleted/i) });
    expect(user.email).toBe("deleted_student-repeated@anonymized.local");
    expect(user.deletedAt).toBeInstanceOf(Date);
    expect(user.isActive).toBe(false);
    expect(user.isBlocked).toBe(true);
    expect(user.save).toHaveBeenCalledOnce();
    expect(revokeAllSessionsForUser).toHaveBeenCalledWith("student-repeated", deletionSession);
  });
});
