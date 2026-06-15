import { getIO } from "./socket";
import logger from "../config/logger.config";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface OrderStatusPayload {
  orderId: string;
  status: OrderStatus;
  estimatedReadyTime?: Date | null;
  message: string;
}

export interface OrderReadyPayload {
  orderId: string;
  pickupCode: string;
}

export interface OrderCancelledPayload {
  orderId: string;
  reason: string;
  cancelledBy: "student" | "cafe" | "admin";
}

/**
 * =========================================================
 * EMIT NEW ORDER TO CAFE
 * =========================================================
 */
export const emitNewOrderToCafe = (
  cafeId: string,
  orderData: unknown,
): void => {
  try {
    getIO().to(`cafe:${cafeId}`).emit("order:new", orderData);

    logger.info("New order notification sent to cafe", {
      cafeId,
    });
  } catch (error) {
    logger.error("Failed to emit new order notification", {
      cafeId,
      error,
    });
  }
};

/**
 * =========================================================
 * EMIT ORDER STATUS UPDATE TO STUDENT
 * =========================================================
 */
export const emitStatusUpdate = (
  studentId: string,
  payload: OrderStatusPayload,
): void => {
  try {
    getIO().to(`student:${studentId}`).emit("order:statusChanged", payload);

    logger.info("Order status update sent", {
      studentId,
      orderId: payload.orderId,
      status: payload.status,
    });
  } catch (error) {
    logger.error("Failed to emit order status update", {
      studentId,
      orderId: payload.orderId,
      error,
    });
  }
};

/**
 * =========================================================
 * EMIT ORDER READY EVENT
 * =========================================================
 */
export const emitOrderReady = (
  studentId: string,
  payload: OrderReadyPayload,
): void => {
  try {
    getIO().to(`student:${studentId}`).emit("order:ready", payload);

    logger.info("Order ready notification sent", {
      studentId,
      orderId: payload.orderId,
    });
  } catch (error) {
    logger.error("Failed to emit order ready notification", {
      studentId,
      orderId: payload.orderId,
      error,
    });
  }
};

/**
 * =========================================================
 * EMIT ORDER CANCELLED EVENT
 * =========================================================
 */
export const emitOrderCancelled = (
  studentId: string,
  payload: OrderCancelledPayload,
): void => {
  try {
    getIO().to(`student:${studentId}`).emit("order:cancelled", payload);

    logger.info("Order cancelled notification sent", {
      studentId,
      orderId: payload.orderId,
      cancelledBy: payload.cancelledBy,
    });
  } catch (error) {
    logger.error("Failed to emit order cancelled notification", {
      studentId,
      orderId: payload.orderId,
      error,
    });
  }
};

/**
 * =========================================================
 * EMIT ADMIN ORDER EVENT
 * =========================================================
 */
export const emitAdminOrderEvent = (event: string, payload: unknown): void => {
  try {
    getIO().to("admins").emit(event, payload);

    logger.info("Admin event emitted", {
      event,
    });
  } catch (error) {
    logger.error("Failed to emit admin event", {
      event,
      error,
    });
  }
};
