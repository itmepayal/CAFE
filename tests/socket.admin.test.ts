import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Socket } from "socket.io";

const emitMock = vi.fn();
const toMock = vi.fn(() => ({ emit: emitMock }));

vi.mock("../src/socket/socket.registry", () => ({
  getIO: () => ({ to: toMock }),
  tryGetIO: () => ({ to: toMock }),
  isSocketInitialized: () => true,
}));

vi.mock("../src/modules/admin/admin.repository", () => ({
  getDashboardStatsRepo: vi.fn().mockResolvedValue({
    totalEarnings: 300,
    totalCollection: 300,
    totalOrders: 3,
    totalUsers: 3,
    pendingCafeRequests: 5,
    activeOrders: 0,
    activeCafes: 2,
    openCafes: 1,
    totalCafes: 2,
    allUsersCount: 3,
    allOrdersCount: 3,
    todayOrders: 1,
    orderStatusCounts: [],
  }),
  getPaymentsRepo: vi.fn().mockResolvedValue({
    summary: {
      totalCollection: 400,
      successCount: 2,
      pendingCount: 1,
      failedCount: 0,
      refundedCount: 0,
    },
    transactions: [],
    total: 3,
    page: 1,
    limit: 10,
  }),
}));

describe("socket envelope", () => {
  it("creates versioned metadata", async () => {
    const { createSocketEnvelope } = await import(
      "../src/socket/admin/admin.envelope"
    );
    const { ADMIN_SOCKET_EVENTS } = await import(
      "../src/socket/admin/admin.events"
    );

    const envelope = createSocketEnvelope(
      ADMIN_SOCKET_EVENTS.CAFE_REQUEST,
      { cafeId: "cafe-1" },
      "cafe_request",
    );

    expect(envelope.meta.event).toBe("admin:cafe:request");
    expect(envelope.meta.version).toBe(1);
    expect(envelope.meta.eventId).toBeTruthy();
    expect(envelope.meta.reason).toBe("cafe_request");
    expect(envelope.data).toEqual({ cafeId: "cafe-1" });
  });
});

describe("admin socket emitter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits enveloped events to the admins room", async () => {
    const { emitToAdmins } = await import("../src/socket/admin/admin.emitter");
    const { ADMIN_SOCKET_EVENTS } = await import(
      "../src/socket/admin/admin.events"
    );

    emitToAdmins(ADMIN_SOCKET_EVENTS.CAFE_REQUEST, { cafeId: "cafe-1" });

    expect(toMock).toHaveBeenCalledWith("admins");
    expect(emitMock).toHaveBeenCalledWith(
      "admin:cafe:request",
      expect.objectContaining({
        meta: expect.objectContaining({
          event: "admin:cafe:request",
          version: 1,
        }),
        data: { cafeId: "cafe-1" },
      }),
    );
  });

  it("skips emit safely when socket server is unavailable", async () => {
    const registry = await import("../src/socket/socket.registry");
    const tryGetIOSpy = vi.spyOn(registry, "tryGetIO").mockReturnValue(null);

    const { emitToAdmins } = await import("../src/socket/admin/admin.emitter");
    const { ADMIN_SOCKET_EVENTS } = await import(
      "../src/socket/admin/admin.events"
    );

    const emitted = emitToAdmins(ADMIN_SOCKET_EVENTS.USER_REGISTERED, {
      userId: "u1",
    });

    expect(emitted).toBe(false);
    expect(emitMock).not.toHaveBeenCalled();

    tryGetIOSpy.mockRestore();
  });
});

describe("admin realtime notifier", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces dashboard updates under burst traffic", async () => {
    const { adminRealtimeNotifier } = await import(
      "../src/socket/admin/admin.notifier"
    );
    const { ADMIN_SOCKET_EVENTS } = await import(
      "../src/socket/admin/admin.events"
    );

    adminRealtimeNotifier.scheduleDashboardRefresh("order");
    adminRealtimeNotifier.scheduleDashboardRefresh("order");
    adminRealtimeNotifier.scheduleDashboardRefresh("order");

    await vi.advanceTimersByTimeAsync(299);
    expect(emitMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2);

    expect(emitMock).toHaveBeenCalledWith(
      ADMIN_SOCKET_EVENTS.DASHBOARD_UPDATED,
      expect.objectContaining({
        meta: expect.objectContaining({ reason: "order" }),
        data: expect.objectContaining({
          stats: expect.objectContaining({ totalOrders: 3 }),
        }),
      }),
    );
    expect(emitMock).toHaveBeenCalledTimes(1);
  });

  it("delivers initial snapshot only to connecting admin socket", async () => {
    const { deliverAdminInitialSnapshot } = await import("../src/socket/admin");
    const { ADMIN_SOCKET_EVENTS } = await import(
      "../src/socket/admin/admin.events"
    );

    const socketEmit = vi.fn();
    const socket = {
      id: "socket-admin-1",
      emit: socketEmit,
    } as unknown as Socket;

    await deliverAdminInitialSnapshot(socket, "admin-1");

    expect(socketEmit).toHaveBeenCalledWith(
      ADMIN_SOCKET_EVENTS.CONNECTED,
      expect.objectContaining({
        meta: expect.objectContaining({ reason: "initial_sync" }),
      }),
    );
    expect(socketEmit).toHaveBeenCalledWith(
      ADMIN_SOCKET_EVENTS.DASHBOARD_UPDATED,
      expect.objectContaining({
        meta: expect.objectContaining({ reason: "initial_sync" }),
      }),
    );
    expect(socketEmit).toHaveBeenCalledWith(
      ADMIN_SOCKET_EVENTS.PAYMENT_UPDATE,
      expect.objectContaining({
        data: expect.objectContaining({
          summary: expect.objectContaining({ successCount: 2 }),
        }),
      }),
    );
  });
});

describe("admin mappers", () => {
  it("builds cafe payload with OPEN/CLOSED label", async () => {
    const { toAdminCafePayload } = await import("../src/socket/admin/admin.mapper");

    const openPayload = toAdminCafePayload(
      {
        _id: "cafe-1",
        cafeName: "HR Cafe",
        ownerName: "Owner",
        status: "approved",
        isOpen: true,
        isVisible: true,
        isBlocked: false,
      },
      "open_toggled",
    );

    expect(openPayload.statusLabel).toBe("OPEN");
    expect(openPayload.action).toBe("open_toggled");
  });
});

describe("autoJoinAdminRoom", () => {
  it("joins admins room only for super_admin", async () => {
    const { autoJoinAdminRoom } = await import("../src/socket/socket.auth");

    const join = vi.fn();
    const adminSocket = {
      id: "socket-1",
      join,
      data: { user: { id: "admin-1", role: "super_admin" } },
    } as unknown as Socket;

    const studentSocket = {
      id: "socket-2",
      join,
      data: { user: { id: "student-1", role: "student" } },
    } as unknown as Socket;

    autoJoinAdminRoom(adminSocket);
    autoJoinAdminRoom(studentSocket);

    expect(join).toHaveBeenCalledTimes(1);
    expect(join).toHaveBeenCalledWith("admins");
  });
});

describe("admin socket event constants", () => {
  it("includes all Figma admin portal events", async () => {
    const { ADMIN_SOCKET_EVENTS } = await import(
      "../src/socket/admin/admin.events"
    );

    expect(ADMIN_SOCKET_EVENTS.DASHBOARD_UPDATED).toBe(
      "admin:dashboard:updated",
    );
    expect(ADMIN_SOCKET_EVENTS.CAFE_REQUEST).toBe("admin:cafe:request");
    expect(ADMIN_SOCKET_EVENTS.PAYMENT_UPDATE).toBe("admin:payment:update");
    expect(ADMIN_SOCKET_EVENTS.USER_REGISTERED).toBe("admin:user:registered");
  });
});
