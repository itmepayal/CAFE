import { beforeEach, describe, expect, it, vi } from "vitest";

const { findCafeByUserIdMock, createCafeMock, updatedCafeMock, findOwnerMock } = vi.hoisted(() => ({
  findCafeByUserIdMock: vi.fn(),
  createCafeMock: vi.fn(),
  updatedCafeMock: vi.fn(),
  findOwnerMock: vi.fn(),
}));

vi.mock("../src/modules/cafes/cafe.repository", () => ({
  findCafeByUserId: (...args: unknown[]) => findCafeByUserIdMock(...args),
  createCafe: (...args: unknown[]) => createCafeMock(...args),
  updatedCafe: (...args: unknown[]) => updatedCafeMock(...args),
  findApprovedCafes: vi.fn(),
  findCafeById: vi.fn(),
  findPublicCafeById: vi.fn(),
}));
vi.mock("../src/models/user", () => ({ default: { findOne: (...args: unknown[]) => findOwnerMock(...args) } }));

import mongoose from "mongoose";
import { registerCafeService } from "../src/modules/cafes/cafe.service";
import Cafe from "../src/models/cafe";

const makeOwner = () => ({ ownedCafe: null, save: vi.fn().mockResolvedValue(undefined) });

describe("Cafe registration atomic ownership guard", () => {
  let lock: Promise<void>;
  const session = {
    withTransaction: vi.fn(async (callback: () => Promise<unknown>) => {
      const previous = lock;
      let release!: () => void;
      lock = new Promise<void>((resolve) => { release = resolve; });
      await previous;
      try { return await callback(); } finally { release(); }
    }),
    endSession: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    lock = Promise.resolve();
    vi.spyOn(mongoose, "startSession").mockResolvedValue(session as never);
    const owner = makeOwner();
    findOwnerMock.mockReturnValue({ session: vi.fn().mockResolvedValue(owner) });
    findCafeByUserIdMock.mockResolvedValue(null);
    createCafeMock.mockResolvedValue({ _id: "cafe-1", status: "pending" });
  });

  it("declares userId as a unique Cafe index key", () => {
    expect(Cafe.schema.path("userId").options.unique).toBe(true);
  });

  it("maps the unique-index duplicate-key race to a 409 conflict", async () => {
    createCafeMock.mockRejectedValueOnce(Object.assign(new Error("duplicate"), { code: 11000 }));
    await expect(registerCafeService("owner-from-auth", {})).rejects.toMatchObject({
      name: "ConflictError", statusCode: 409,
    });
    expect(findOwnerMock).toHaveBeenCalledWith(expect.objectContaining({ _id: "owner-from-auth" }));
    expect(createCafeMock).toHaveBeenCalledTimes(1);
  });

  it("forces authenticated ownership and pending status over client payload values", async () => {
    await registerCafeService("owner-from-auth", {
      userId: "attacker-owner",
      status: "approved",
      isVisible: true,
      isBlocked: false,
    });
    expect(createCafeMock).toHaveBeenCalledWith(expect.objectContaining({
      userId: "owner-from-auth",
      status: "pending",
      isVisible: false,
      isBlocked: false,
      isOpen: false,
      isFeatured: false,
    }), expect.anything());
  });

  it("serializes concurrent registrations so one cafe is created for an owner", async () => {
    let existing: { _id: string; status: string } | null = null;
    findCafeByUserIdMock.mockImplementation(async (ownerId: string) => {
      expect(ownerId).toBe("owner-from-auth");
      return existing;
    });
    createCafeMock.mockImplementation(async () => {
      existing = { _id: "cafe-1", status: "pending" };
      return existing;
    });

    const outcomes = await Promise.allSettled([
      registerCafeService("owner-from-auth", {}),
      registerCafeService("owner-from-auth", {}),
    ]);
    expect(outcomes.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(createCafeMock).toHaveBeenCalledTimes(1);
    expect(findOwnerMock).toHaveBeenCalledTimes(2);
    expect(session.withTransaction).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["inactive", { isActive: false }],
    ["blocked", { isBlocked: true }],
    ["deleted", { deletedAt: new Date() }],
  ])("does not create a cafe when owner account is %s", async (_label, ownerState) => {
    findOwnerMock.mockReturnValue({ session: vi.fn().mockResolvedValue(null) });
    await expect(registerCafeService("owner-from-auth", ownerState)).rejects.toMatchObject({
      name: "ForbiddenError", statusCode: 403,
    });
    expect(createCafeMock).not.toHaveBeenCalled();
  });
});
