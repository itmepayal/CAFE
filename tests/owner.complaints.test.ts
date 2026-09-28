import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../src/modules/owner/owner.repository", async () => {
  const actual = await vi.importActual<
    typeof import("../src/modules/owner/owner.repository")
  >("../src/modules/owner/owner.repository");
  return {
    ...actual,
    findCafeByUserId: vi.fn(),
    findMyComplaints: vi.fn(),
  };
});

import {
  findCafeByUserId,
  findMyComplaints,
} from "../src/modules/owner/owner.repository";
import { getMyComplaintsService } from "../src/modules/owner/owner.service";

describe("owner cafe complaints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries complaints by cafeId not owner userId", async () => {
    vi.mocked(findCafeByUserId).mockResolvedValue({
      _id: "cafe_abc",
    } as any);
    vi.mocked(findMyComplaints).mockResolvedValue({
      complaints: [],
      total: 0,
      page: 1,
      limit: 10,
    });

    await getMyComplaintsService("owner_1");

    expect(findMyComplaints).toHaveBeenCalledWith(
      "cafe_abc",
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it("throws when owner has no cafe", async () => {
    vi.mocked(findCafeByUserId).mockResolvedValue(null);

    await expect(getMyComplaintsService("owner_x")).rejects.toThrow(
      /Cafe not found/,
    );
  });
});
