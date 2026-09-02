import type { Socket } from "socket.io";
import logger from "../../config/logger.config";
import Cafe from "../../models/cafe";
import { findCafeByUserId } from "../../modules/cafes/cafe.repository";
import {
  OWNER_REALTIME_REASONS,
  OWNER_SOCKET_EVENTS,
} from "./owner.events";
import { emitEnvelopeOnSocket, emitToCafeRoom } from "./owner.emitter";
import { fetchOwnerDashboardStats } from "./owner.snapshot";
import type { OwnerConnectedPayload } from "./owner.types";
import { SOCKET_PROTOCOL_VERSION, SOCKET_ROOMS } from "../constants";

class OwnerRealtimeNotifier {
  emitNewOrder(cafeId: string, orderData: unknown): void {
    emitToCafeRoom(
      OWNER_SOCKET_EVENTS.ORDER_NEW,
      cafeId,
      orderData,
      OWNER_REALTIME_REASONS.ORDER_NEW,
    );
    this.scheduleDashboardRefresh(cafeId);
  }

  emitOrderUpdated(cafeId: string, orderData: unknown): void {
    emitToCafeRoom(
      OWNER_SOCKET_EVENTS.ORDER_UPDATED,
      cafeId,
      orderData,
      OWNER_REALTIME_REASONS.ORDER_UPDATED,
    );
    this.scheduleDashboardRefresh(cafeId);
  }

  emitOrderCancelled(cafeId: string, orderData: unknown): void {
    emitToCafeRoom(
      OWNER_SOCKET_EVENTS.ORDER_CANCELLED,
      cafeId,
      orderData,
      OWNER_REALTIME_REASONS.ORDER_CANCELLED,
    );
    this.scheduleDashboardRefresh(cafeId);
  }

  scheduleDashboardRefresh(cafeId: string): void {
    void this.flushDashboardUpdate(cafeId);
  }

  async deliverInitialSnapshot(socket: Socket, userId: string): Promise<void> {
    try {
      const cafe = await findCafeByUserId(userId);

      if (!cafe || cafe.status !== "approved") {
        return;
      }

      const cafeId = cafe._id.toString();
      const connectedPayload: OwnerConnectedPayload = {
        userId,
        cafeId,
        subscribed: true,
        rooms: [SOCKET_ROOMS.cafe(cafeId)],
        protocolVersion: SOCKET_PROTOCOL_VERSION,
        message: "Cafe owner real-time channel ready",
      };

      emitEnvelopeOnSocket(
        socket,
        OWNER_SOCKET_EVENTS.CONNECTED,
        connectedPayload,
        OWNER_REALTIME_REASONS.INITIAL_SYNC,
      );

      const stats = await fetchOwnerDashboardStats(cafe);

      emitEnvelopeOnSocket(
        socket,
        OWNER_SOCKET_EVENTS.DASHBOARD_UPDATED,
        { stats },
        OWNER_REALTIME_REASONS.INITIAL_SYNC,
      );

      logger.info("Owner initial realtime snapshot delivered", {
        socketId: socket.id,
        userId,
        cafeId,
      });
    } catch (error) {
      logger.error("Failed to deliver owner initial snapshot", {
        socketId: socket.id,
        userId,
        error,
      });
    }
  }

  private async flushDashboardUpdate(cafeId: string): Promise<void> {
    try {
      const cafeDoc = await Cafe.findById(cafeId);

      if (!cafeDoc || cafeDoc.status !== "approved") {
        return;
      }

      const stats = await fetchOwnerDashboardStats(cafeDoc);

      emitToCafeRoom(
        OWNER_SOCKET_EVENTS.DASHBOARD_UPDATED,
        cafeId,
        { stats },
        OWNER_REALTIME_REASONS.DASHBOARD,
      );
    } catch (error) {
      logger.error("Failed to flush owner dashboard update", { cafeId, error });
    }
  }
}

export const ownerRealtimeNotifier = new OwnerRealtimeNotifier();

export const emitOwnerNewOrder = (cafeId: string, orderData: unknown): void =>
  ownerRealtimeNotifier.emitNewOrder(cafeId, orderData);

export const emitOwnerOrderUpdated = (
  cafeId: string,
  orderData: unknown,
): void => ownerRealtimeNotifier.emitOrderUpdated(cafeId, orderData);

export const emitOwnerOrderCancelled = (
  cafeId: string,
  orderData: unknown,
): void => ownerRealtimeNotifier.emitOrderCancelled(cafeId, orderData);

export const deliverOwnerInitialSnapshot = (
  socket: Socket,
  userId: string,
): Promise<void> => ownerRealtimeNotifier.deliverInitialSnapshot(socket, userId);
