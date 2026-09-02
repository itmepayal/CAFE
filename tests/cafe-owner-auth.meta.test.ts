import { describe, expect, it, vi, beforeEach } from "vitest";

const findCafeByUserIdMock = vi.fn();

vi.mock("../src/modules/cafes/cafe.repository", () => ({
  findCafeByUserId: (...args: unknown[]) => findCafeByUserIdMock(...args),
}));

import { resolveCafeOwnerLoginMeta } from "../src/modules/auth/cafe-owner-auth.meta";

describe("resolveCafeOwnerLoginMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to register when no cafe exists", async () => {
    findCafeByUserIdMock.mockResolvedValue(null);

    const meta = await resolveCafeOwnerLoginMeta("user-1", "student");

    expect(meta).toEqual({
      portal: "cafe_owner",
      redirectTo: "register_cafe",
      cafeStatus: "not_registered",
    });
  });

  it("redirects to pending approval for pending cafe", async () => {
    findCafeByUserIdMock.mockResolvedValue({
      _id: { toString: () => "cafe-1" },
      status: "pending",
    });

    const meta = await resolveCafeOwnerLoginMeta("user-1", "student");

    expect(meta.redirectTo).toBe("pending_approval");
    expect(meta.cafeStatus).toBe("pending");
    expect(meta.cafeId).toBe("cafe-1");
  });

  it("redirects to dashboard for approved cafe owner", async () => {
    findCafeByUserIdMock.mockResolvedValue({
      _id: { toString: () => "cafe-2" },
      status: "approved",
    });

    const meta = await resolveCafeOwnerLoginMeta("user-2", "cafe_owner");

    expect(meta.redirectTo).toBe("dashboard");
    expect(meta.cafeStatus).toBe("approved");
    expect(meta.cafeId).toBe("cafe-2");
  });

  it("redirects to rejected screen for rejected cafe", async () => {
    findCafeByUserIdMock.mockResolvedValue({
      _id: { toString: () => "cafe-3" },
      status: "rejected",
    });

    const meta = await resolveCafeOwnerLoginMeta("user-3", "student");

    expect(meta.redirectTo).toBe("rejected");
    expect(meta.cafeStatus).toBe("rejected");
  });
});
