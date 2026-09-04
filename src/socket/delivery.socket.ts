import { Socket } from "socket.io";
import { getIO } from "./socket.registry";
import { SOCKET_ROOMS } from "./constants";
import { findOrderByIdRepo } from "../modules/order/order.repository";
import logger from "../config/logger.config";
import { emitAdminOrderEvent } from "./admin";

export interface DeliveryLocationPayload {
  orderId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

/**
 * Handle incoming real-time GPS location update from a delivery partner
 */
export const handleDeliveryLocationUpdate = async (
  socket: Socket,
  payload: DeliveryLocationPayload,
): Promise<void> => {
  try {
    const user = socket.data.user as { id: string; role: string } | undefined;

    if (!user) {
      logger.warn("Unauthenticated delivery location update attempt", {
        socketId: socket.id,
      });
      return;
    }

    const { orderId, latitude, longitude, heading, speed } = payload;

    if (!orderId || typeof latitude !== "number" || typeof longitude !== "number") {
      logger.warn("Invalid delivery location payload", {
        socketId: socket.id,
        payload,
      });
      return;
    }

    // Verify order and delivery partner authorization
    const order = await findOrderByIdRepo(orderId);

    const deliveryPersonId = order.deliveryPersonId
      ? order.deliveryPersonId._id
        ? order.deliveryPersonId._id.toString()
        : order.deliveryPersonId.toString()
      : null;

    if (deliveryPersonId !== user.id && user.role !== "super_admin") {
      logger.warn("Unauthorized delivery location update attempt", {
        socketId: socket.id,
        userId: user.id,
        orderId,
      });
      return;
    }

    const streamPayload = {
      orderId,
      deliveryPersonId: user.id,
      latitude,
      longitude,
      heading: heading ?? null,
      speed: speed ?? null,
      updatedAt: new Date().toISOString(),
    };

    // Broadcast location update to order room (customer student + cafe owner + deliverer)
    getIO()
      .to(SOCKET_ROOMS.order(orderId))
      .emit("order:locationStream", streamPayload);

    // Broadcast to super admin dashboard
    emitAdminOrderEvent("admin:orderLocationStream", streamPayload);

    logger.debug("Delivery location broadcasted", {
      orderId,
      deliveryPersonId: user.id,
      latitude,
      longitude,
    });
  } catch (error) {
    logger.error("Failed to process delivery location update", {
      socketId: socket.id,
      error,
    });
  }
};
