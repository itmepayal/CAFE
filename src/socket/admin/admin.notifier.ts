import type { Socket } from "socket.io";
import logger from "../../config/logger.config";
import {
  ADMIN_REALTIME_REASONS,
  SOCKET_CONFIG,
  SOCKET_PROTOCOL_VERSION,
  SOCKET_ROOMS,
  type AdminRealtimeReason,
} from "../constants";
import { ADMIN_SOCKET_EVENTS } from "./admin.events";
import { emitToAdmins } from "./admin.emitter";
import { createSocketEnvelope } from "./admin.envelope";
import { toAdminCafePayload } from "./admin.mapper";
import { fetchAdminRealtimeSnapshot } from "./admin.snapshot";
import type {
  AdminCafeAction,
  AdminConnectedPayload,
  AdminPaymentSocketPayload,
  AdminUserRegisteredPayload,
} from "./admin.types";
import type { AdminSocketEvent } from "./admin.events";

type CafeSource = Parameters<typeof toAdminCafePayload>[0];

/**
 * Centralized, production-safe notifier for the Super Admin real-time portal.
 * - Envelope-based payloads (eventId, timestamp, version)
 * - Debounced dashboard refreshes under burst traffic
 * - Initial snapshot sync on admin socket connect
 */
class AdminRealtimeNotifier {
  private dashboardTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingDashboardReason: AdminRealtimeReason =
    ADMIN_REALTIME_REASONS.STATS_CHANGED;
  private dashboardFlushInFlight = false;

  emitCafeRequest(cafe: CafeSource): void {
    emitToAdmins(
      ADMIN_SOCKET_EVENTS.CAFE_REQUEST,
      toAdminCafePayload(cafe, "request_submitted"),
      ADMIN_REALTIME_REASONS.CAFE_REQUEST,
    );
    this.scheduleDashboardRefresh(ADMIN_REALTIME_REASONS.CAFE_REQUEST);
  }

  emitCafeUpdated(cafe: CafeSource, action: AdminCafeAction): void {
    emitToAdmins(
      ADMIN_SOCKET_EVENTS.CAFE_UPDATED,
      toAdminCafePayload(cafe, action),
      ADMIN_REALTIME_REASONS.CAFE_UPDATED,
    );
    this.scheduleDashboardRefresh(ADMIN_REALTIME_REASONS.CAFE_UPDATED);
  }

  emitUserRegistered(payload: AdminUserRegisteredPayload): void {
    emitToAdmins(
      ADMIN_SOCKET_EVENTS.USER_REGISTERED,
      payload,
      ADMIN_REALTIME_REASONS.USER_REGISTERED,
    );
    this.scheduleDashboardRefresh(ADMIN_REALTIME_REASONS.USER_REGISTERED);
  }

  emitOrderEvent(event: AdminSocketEvent, payload: unknown): void {
    emitToAdmins(event, payload, ADMIN_REALTIME_REASONS.ORDER);
    this.scheduleDashboardRefresh(ADMIN_REALTIME_REASONS.ORDER);
  }

  emitPaymentUpdate(
    transaction: AdminPaymentSocketPayload,
    reason: string = ADMIN_REALTIME_REASONS.PAYMENT_CHANGED,
  ): void {
    void this.flushPaymentUpdate(transaction, reason);
  }

  async deliverInitialSnapshot(socket: Socket, userId: string): Promise<void> {
    try {
      const connectedPayload: AdminConnectedPayload = {
        userId,
        subscribed: true,
        rooms: [SOCKET_ROOMS.ADMINS],
        protocolVersion: SOCKET_PROTOCOL_VERSION,
        message: "Admin real-time channel ready",
      };

      const connectedEnvelope = createSocketEnvelope(
        ADMIN_SOCKET_EVENTS.CONNECTED,
        connectedPayload,
        ADMIN_REALTIME_REASONS.INITIAL_SYNC,
      );

      socket.emit(ADMIN_SOCKET_EVENTS.CONNECTED, connectedEnvelope);

      const snapshot = await fetchAdminRealtimeSnapshot();

      const dashboardEnvelope = createSocketEnvelope(
        ADMIN_SOCKET_EVENTS.DASHBOARD_UPDATED,
        { stats: snapshot.stats },
        ADMIN_REALTIME_REASONS.INITIAL_SYNC,
      );

      socket.emit(ADMIN_SOCKET_EVENTS.DASHBOARD_UPDATED, dashboardEnvelope);

      const paymentEnvelope = createSocketEnvelope(
        ADMIN_SOCKET_EVENTS.PAYMENT_UPDATE,
        {
          transaction: null,
          summary: snapshot.paymentSummary,
        },
        ADMIN_REALTIME_REASONS.INITIAL_SYNC,
      );

      socket.emit(ADMIN_SOCKET_EVENTS.PAYMENT_UPDATE, paymentEnvelope);

      logger.info("Admin initial realtime snapshot delivered", {
        socketId: socket.id,
        userId,
      });
    } catch (error) {
      logger.error("Failed to deliver admin initial snapshot", {
        socketId: socket.id,
        userId,
        error,
      });
    }
  }

  scheduleDashboardRefresh(
    reason: AdminRealtimeReason = ADMIN_REALTIME_REASONS.STATS_CHANGED,
  ): void {
    this.pendingDashboardReason = reason;

    if (this.dashboardTimer) {
      clearTimeout(this.dashboardTimer);
    }

    this.dashboardTimer = setTimeout(() => {
      this.dashboardTimer = null;
      void this.flushDashboardUpdate(this.pendingDashboardReason);
    }, SOCKET_CONFIG.DASHBOARD_DEBOUNCE_MS);
  }

  private async flushDashboardUpdate(reason: AdminRealtimeReason): Promise<void> {
    if (this.dashboardFlushInFlight) {
      this.scheduleDashboardRefresh(reason);
      return;
    }

    this.dashboardFlushInFlight = true;

    try {
      const { stats } = await fetchAdminRealtimeSnapshot();

      emitToAdmins(
        ADMIN_SOCKET_EVENTS.DASHBOARD_UPDATED,
        { stats },
        reason,
      );
    } catch (error) {
      logger.error("Failed to flush admin dashboard update", { reason, error });
    } finally {
      this.dashboardFlushInFlight = false;
    }
  }

  private async flushPaymentUpdate(
    transaction: AdminPaymentSocketPayload,
    reason: string,
  ): Promise<void> {
    try {
      const { paymentSummary } = await fetchAdminRealtimeSnapshot();

      emitToAdmins(
        ADMIN_SOCKET_EVENTS.PAYMENT_UPDATE,
        {
          transaction,
          summary: paymentSummary,
        },
        reason,
      );

      this.scheduleDashboardRefresh(ADMIN_REALTIME_REASONS.PAYMENT_CHANGED);
    } catch (error) {
      logger.error("Failed to flush admin payment update", { reason, error });
    }
  }
}

export const adminRealtimeNotifier = new AdminRealtimeNotifier();

// Backward-compatible functional exports used by domain services
export const emitAdminCafeRequest = (cafe: CafeSource): void =>
  adminRealtimeNotifier.emitCafeRequest(cafe);

export const emitAdminCafeUpdated = (
  cafe: CafeSource,
  action: AdminCafeAction,
): void => adminRealtimeNotifier.emitCafeUpdated(cafe, action);

export const emitAdminUserRegistered = (
  payload: AdminUserRegisteredPayload,
): void => adminRealtimeNotifier.emitUserRegistered(payload);

export const emitAdminOrderEvent = (
  event: AdminSocketEvent,
  payload: unknown,
): void => adminRealtimeNotifier.emitOrderEvent(event, payload);

export const notifyAdminPaymentUpdate = (
  transaction: AdminPaymentSocketPayload,
  reason?: string,
): void => adminRealtimeNotifier.emitPaymentUpdate(transaction, reason);

export const notifyAdminDashboardUpdate = (
  reason?: AdminRealtimeReason,
): void => adminRealtimeNotifier.scheduleDashboardRefresh(reason);

export const deliverAdminInitialSnapshot = (
  socket: Socket,
  userId: string,
): Promise<void> =>
  adminRealtimeNotifier.deliverInitialSnapshot(socket, userId);
