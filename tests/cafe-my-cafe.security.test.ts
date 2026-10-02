import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMyCafeByOwnerIdMock, hasActiveUndeletedAccountMock, otherRepoMock } = vi.hoisted(() => ({
  findMyCafeByOwnerIdMock: vi.fn(),
  hasActiveUndeletedAccountMock: vi.fn(),
  otherRepoMock: vi.fn(),
}));

vi.mock("../src/modules/cafes/cafe.repository", () => ({
  findMyCafeByOwnerId: (...args: unknown[]) => findMyCafeByOwnerIdMock(...args),
  hasActiveUndeletedAccount: (...args: unknown[]) => hasActiveUndeletedAccountMock(...args),
  findCafeByUserId: otherRepoMock,
  createCafe: otherRepoMock,
  updatedCafe: otherRepoMock,
  findApprovedCafes: otherRepoMock,
  findPublicCafeById: otherRepoMock,
}));
import { getMyCafeController } from "../src/modules/cafes/cafe.controller";
import { getMyCafeService } from "../src/modules/cafes/cafe.service";
import Cafe from "../src/models/cafe";

const ownerCafe = (overrides: Record<string, unknown> = {}) => ({
  _id: "cafe-a",
  userId: "owner-a",
  cafeName: "A Cafe",
  ownerName: "Owner A",
  status: "approved",
  bankDetails: { accountNumber: "private" },
  documents: { aadharNumber: "private", fssaiNumber: "private" },
  adminNote: "internal",
  approvedBy: "admin-id",
  stats: { totalRevenue: 5000 },
  ...overrides,
});

describe("GET /cafes/my-cafe security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasActiveUndeletedAccountMock.mockResolvedValue(true);
  });

  it("uses only the authenticated user ID even when client IDs are supplied", async () => {
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    findMyCafeByOwnerIdMock.mockResolvedValue(ownerCafe({ status: "pending" }));
    await new Promise<void>((resolve) => {
      response.json.mockImplementation(() => { resolve(); return response as any; });
      getMyCafeController({
        user: { id: "owner-a" },
        params: { id: "cafe-b", userId: "owner-b" },
        query: { ownerId: "owner-b", cafeId: "cafe-b" },
        body: { ownerId: "owner-b", userId: "owner-b", cafeId: "cafe-b" },
      } as never, response as never, vi.fn());
    });

    expect(findMyCafeByOwnerIdMock).toHaveBeenCalledWith("owner-a");
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "pending" }),
    }));
  });

  it("rejects a missing authenticated user ID before querying", async () => {
    const next = vi.fn();
    await new Promise<void>((resolve) => {
      next.mockImplementation(() => resolve());
      getMyCafeController({ body: { userId: "owner-a" } } as never, {} as never, next);
    });
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(findMyCafeByOwnerIdMock).not.toHaveBeenCalled();
  });

  it("returns only the safe owner-facing cafe fields, not internal or private fields", async () => {
    findMyCafeByOwnerIdMock.mockResolvedValue(ownerCafe());
    const result = await getMyCafeService("owner-a");
    expect(findMyCafeByOwnerIdMock).toHaveBeenCalledWith("owner-a");
    expect(result).toMatchObject({ _id: "cafe-a", cafeName: "A Cafe", status: "approved" });
    for (const hidden of ["userId", "bankDetails", "documents", "adminNote", "approvedBy", "stats"]) {
      expect(result).not.toHaveProperty(hidden);
    }
  });

  it.each(["pending", "rejected"])("returns a minimal %s registration status", async (status) => {
    findMyCafeByOwnerIdMock.mockResolvedValue(ownerCafe({ status, adminNote: "do not disclose" }));
    const result = await getMyCafeService("owner-a");
    expect(result).toEqual(expect.objectContaining({ status }));
    expect(result).not.toHaveProperty("adminNote");
    expect(result).not.toHaveProperty("bankDetails");
  });

  it("returns 404 when the authenticated owner has no cafe", async () => {
    findMyCafeByOwnerIdMock.mockResolvedValue(null);
    await expect(getMyCafeService("owner-a")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("rejects deleted, blocked, or inactive accounts before the cafe query", async () => {
    hasActiveUndeletedAccountMock.mockResolvedValue(false);
    await expect(getMyCafeService("owner-a")).rejects.toMatchObject({ statusCode: 403 });
    expect(hasActiveUndeletedAccountMock).toHaveBeenCalledWith("owner-a");
    expect(findMyCafeByOwnerIdMock).not.toHaveBeenCalled();
  });

  it("declares a unique owner index for the lookup field", () => {
    expect(Cafe.schema.path("userId").options.unique).toBe(true);
  });
});
