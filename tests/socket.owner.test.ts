import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Socket } from "socket.io";

const emitMock = vi.fn();
const toMock = vi.fn(() => ({ emit: emitMock }));

vi.mock("../src/socket/socket.registry", () => ({
  getIO: () => ({ to: toMock }),
  tryGetIO: () => ({ to: toMock }),
  isSocketInitialized: () => true,
}));

vi.mock("../src/modules/cafes/cafe.repository", () => ({
  findCafeByUserId: vi.fn(),
}));

vi.mock("../src/models/cafe", () => ({
  default: {
    findById: vi.fn(),
  },
}));

vi.mock("../src/modules/owner/owner.repository", () => ({
  getOwnerDashboardStatsRepo: vi.fn().mockResolvedValue({
    activeOrders: 2,
    pendingOrders: 1,
    todayOrders: 5,
    todayRevenue: 500,
    totalRevenue: 12000,
    completedToday: 3,
    isOpen: true,
    cafeName: "MS Cafe",
  }),
}));

describe("owner socket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits enveloped order events to cafe room", async () => {
    const { emitOwnerNewOrder } = await import("../src/socket/owner");

    emitOwnerNewOrder("cafe-1", { orderId: "order-1" });

    expect(toMock).toHaveBeenCalledWith("cafe:cafe-1");
    expect(emitMock).toHaveBeenCalledWith(
      "owner:order:new",
      expect.objectContaining({
        meta: expect.objectContaining({ event: "owner:order:new", version: 1 }),
        data: { orderId: "order-1" },
      }),
    );
  });

  it("auto-joins approved cafe owner to cafe room", async () => {
    const { findCafeByUserId } = await import(
      "../src/modules/cafes/cafe.repository"
    );
    const { autoJoinOwnerCafeRoom } = await import("../src/socket/socket.auth");

    vi.mocked(findCafeByUserId).mockResolvedValue({
      _id: { toString: () => "cafe-1" },
      status: "approved",
    } as any);

    const join = vi.fn();
    const socket = {
      id: "socket-owner-1",
      join,
      data: { user: { id: "owner-1", role: "cafe_owner" } },
    } as unknown as Socket;

    const joined = await autoJoinOwnerCafeRoom(socket);

    expect(joined).toBe(true);
    expect(join).toHaveBeenCalledWith("cafe:cafe-1");
  });
});
