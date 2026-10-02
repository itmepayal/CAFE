import { beforeEach, describe, expect, it, vi } from "vitest";

const { approvedMock, byIdMock } = vi.hoisted(() => ({
  approvedMock: vi.fn(),
  byIdMock: vi.fn(),
}));

vi.mock("../src/modules/cafes/cafe.service", () => ({
  registerCafeService: vi.fn(),
  getApprovedCafesService: (...args: unknown[]) => approvedMock(...args),
  getCafeByIdService: (...args: unknown[]) => byIdMock(...args),
  getMyCafeService: vi.fn(),
}));

import { getApprovedCafesController, getCafeByIdController } from "../src/modules/cafes/cafe.controller";

const invokeSuccess = async (
  controller: (req: never, res: never, next: never) => void,
  req: Record<string, unknown>,
) => {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  await new Promise<void>((resolve, reject) => {
    res.json.mockImplementation((body) => { resolve(); return res as any; });
    controller(req as never, res as never, ((error?: unknown) => reject(error)) as never);
  });
  return res;
};

describe("cafe controller response envelope", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses ApiResponse for approved cafes and keeps cafe pagination with status 200", async () => {
    approvedMock.mockResolvedValue({ cafes: [{ _id: "c1" }], total: 21, page: 2, limit: 10 });
    const res = await invokeSuccess(getApprovedCafesController as never, { query: { page: "2", limit: "10" } });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Approved cafes fetched successfully",
      data: { cafes: [{ _id: "c1" }], pagination: { total: 21, page: 2, limit: 10, totalPages: 3 } },
      meta: null,
    });
  });

  it("uses ApiResponse for cafe-by-ID with status 200", async () => {
    byIdMock.mockResolvedValue({ _id: "c1", cafeName: "Cafe" });
    const res = await invokeSuccess(getCafeByIdController as never, { params: { id: "c1" } });

    expect(byIdMock).toHaveBeenCalledWith("c1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Cafe fetched",
      data: { _id: "c1", cafeName: "Cafe" },
      meta: null,
    });
  });

  it("forwards service errors to the global error handler", async () => {
    const error = new Error("lookup failed");
    byIdMock.mockRejectedValue(error);
    const next = vi.fn();
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await new Promise<void>((resolve) => {
      next.mockImplementation(() => resolve());
      getCafeByIdController({ params: { id: "c1" } } as never, res as never, next);
    });
    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
