import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const state: { owner: any; cafe: any } = { owner: null, cafe: null };
  const findOwnerMock = vi.fn();
  const findUserByIdMock = vi.fn();
  const findCafeByUserIdMock = vi.fn();
  const createCafeMock = vi.fn();
  const updatedCafeMock = vi.fn();
  const findCafeForDeleteMock = vi.fn();
  const revokeAllSessionsMock = vi.fn();
  return {
    state, findOwnerMock, findUserByIdMock, findCafeByUserIdMock,
    createCafeMock, updatedCafeMock, findCafeForDeleteMock, revokeAllSessionsMock,
  };
});

vi.mock("../src/models/user", () => ({
  default: {
    findOne: (...args: unknown[]) => mocks.findOwnerMock(...args),
    findById: (...args: unknown[]) => mocks.findUserByIdMock(...args),
  },
}));
vi.mock("../src/models/cafe", () => ({
  default: { findOne: (...args: unknown[]) => mocks.findCafeForDeleteMock(...args) },
}));
vi.mock("../src/modules/cafes/cafe.repository", () => ({
  findCafeByUserId: (...args: unknown[]) => mocks.findCafeByUserIdMock(...args),
  createCafe: (...args: unknown[]) => mocks.createCafeMock(...args),
  updatedCafe: (...args: unknown[]) => mocks.updatedCafeMock(...args),
  findApprovedCafes: vi.fn(), findPublicCafeById: vi.fn(), findMyCafeByOwnerId: vi.fn(),
  hasActiveUndeletedAccount: vi.fn(),
}));
vi.mock("../src/modules/auth/session.repository", () => ({
  revokeAllSessionsForUser: (...args: unknown[]) => mocks.revokeAllSessionsMock(...args),
}));
vi.mock("../src/modules/auth/auth.repository", () => ({
  findUserById: (...args: unknown[]) => mocks.findUserByIdMock(...args),
  updateProfileRepo: vi.fn(), findUserByEmailWithPassword: vi.fn(), createAdminEmailUser: vi.fn(),
}));
vi.mock("../src/modules/auth/auth.tokens", () => ({
  revokeRefreshToken: vi.fn(), rotateRefreshToken: vi.fn(), issueAuthTokens: vi.fn(),
}));
vi.mock("../src/modules/auth/social-auth.core", () => ({
  loginWithProvider: vi.fn(), loginAdminWithProvider: vi.fn(),
  loginOrSignUpCafeOwnerWithProvider: vi.fn(), authenticateUser: vi.fn(),
}));
vi.mock("../src/modules/admin/admin-invite.service", () => ({ validateAndConsumeAdminInvite: vi.fn(), markInviteUsedBy: vi.fn() }));
vi.mock("../src/utils/auth/password", () => ({ hashPassword: vi.fn(), comparePassword: vi.fn() }));
vi.mock("../src/modules/auth/cafe-owner-auth.meta", () => ({ resolveCafeOwnerLoginMeta: vi.fn() }));
vi.mock("../src/config/logger.config", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("../src/socket/admin", () => ({ emitAdminCafeRequest: vi.fn(), emitAdminUserRegistered: vi.fn() }));

import mongoose from "mongoose";
import { deleteAccount } from "../src/modules/auth/auth.service";
import { registerCafeService } from "../src/modules/cafes/cafe.service";

describe("account deletion vs cafe registration transaction race", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let transactionTail = Promise.resolve();
    vi.spyOn(mongoose, "startSession").mockImplementation(async () => ({
      withTransaction: async (callback: () => Promise<unknown>) => {
        const previous = transactionTail;
        let release!: () => void;
        transactionTail = new Promise<void>((resolve) => { release = resolve; });
        await previous;
        try { return await callback(); } finally { release(); }
      },
      endSession: vi.fn().mockResolvedValue(undefined),
    }) as never);

    const owner = {
      _id: { toString: () => "owner-1" },
      role: "student", ownedCafe: null, name: "Owner", email: "owner@example.com",
      phone: "123", profileImage: "pic", providerId: "google-sub", deletedAt: null,
      isActive: true, isBlocked: false, deviceTokens: ["device"], favoriteCafes: [],
      university: "University", hostel: "Hostel", adminNote: "",
      set: vi.fn(), save: vi.fn().mockResolvedValue(undefined),
    };
    mocks.state.owner = owner;
    mocks.state.cafe = null;

    mocks.findOwnerMock.mockImplementation((filter: any) => ({
      session: vi.fn().mockImplementation(async () => {
        const roleMatches = filter.role.$in.includes(owner.role);
        return filter._id === "owner-1" && roleMatches && owner.isActive && !owner.isBlocked && !owner.deletedAt
          ? owner
          : null;
      }),
    }));
    mocks.findUserByIdMock.mockReturnValue({
      select: vi.fn().mockReturnValue({ session: vi.fn().mockResolvedValue(owner) }),
    });
    mocks.findCafeForDeleteMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        session: vi.fn().mockReturnValue({ lean: vi.fn().mockImplementation(async () => mocks.state.cafe) }),
      }),
    });
    mocks.findCafeByUserIdMock.mockImplementation(async (userId: string) =>
      userId === "owner-1" ? mocks.state.cafe : null);
    mocks.createCafeMock.mockImplementation(async (payload: Record<string, unknown>) => {
      mocks.state.cafe = { ...payload, _id: "cafe-1", status: "pending" };
      return mocks.state.cafe;
    });
    mocks.revokeAllSessionsMock.mockResolvedValue(2);
  });

  it.each(["registration-first", "deletion-first"] as const)(
    "never leaves a cafe attached to an anonymized owner (%s scheduling)",
    async (first) => {
      const registration = () => registerCafeService("owner-1", { cafeName: "Cafe" });
      const deletion = () => deleteAccount("owner-1");
      const results = await Promise.allSettled(
        first === "registration-first"
          ? [registration(), deletion()]
          : [deletion(), registration()],
      );

      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
      expect(mocks.state.owner.deletedAt && mocks.state.cafe).toBeFalsy();
      if (mocks.state.cafe) {
        expect(mocks.state.owner.isActive).toBe(true);
        expect(mocks.state.owner.isBlocked).toBe(false);
        expect(mocks.state.owner.deletedAt).toBeNull();
      }
      if (mocks.state.owner.deletedAt) {
        expect(mocks.state.owner.isActive).toBe(false);
        expect(mocks.state.owner.isBlocked).toBe(true);
        expect(mocks.revokeAllSessionsMock).toHaveBeenCalledWith("owner-1", expect.any(Object));
      }
    },
  );
});
