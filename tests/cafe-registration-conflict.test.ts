import { beforeEach, describe, expect, it, vi } from "vitest";

const { findCafeByUserIdMock, createCafeMock, updatedCafeMock } = vi.hoisted(() => ({
  findCafeByUserIdMock: vi.fn(),
  createCafeMock: vi.fn(),
  updatedCafeMock: vi.fn(),
}));

vi.mock("../src/modules/cafes/cafe.repository", () => ({
  findCafeByUserId: (...args: unknown[]) => findCafeByUserIdMock(...args),
  createCafe: (...args: unknown[]) => createCafeMock(...args),
  updatedCafe: (...args: unknown[]) => updatedCafeMock(...args),
  findApprovedCafes: vi.fn(),
  findCafeById: vi.fn(),
  findPublicCafeById: vi.fn(),
}));

import { registerCafeService } from "../src/modules/cafes/cafe.service";
import Cafe from "../src/models/cafe";

describe("Cafe registration database conflict handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findCafeByUserIdMock.mockResolvedValue(null);
  });

  it("declares userId as a unique Cafe index key", () => {
    expect(Cafe.schema.path("userId").options.unique).toBe(true);
  });

  it("converts a Mongo duplicate-key race into a 409 conflict", async () => {
    createCafeMock.mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));

    await expect(registerCafeService("user-1", {})).rejects.toMatchObject({
      name: "ConflictError",
      statusCode: 409,
      message: "Cafe already registered for this user",
    });
  });
});
