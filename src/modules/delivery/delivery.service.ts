import {
  findAvailableDeliveryOrdersRepo,
  claimDeliveryOrderRepo,
  findStudentDeliveriesRepo,
  findDeliveryOrderByIdRepo,
  updateDeliveryStatusInDbRepo,
  cancelDeliveryAssignmentRepo,
} from "./delivery.repository";
import {
  GetAvailableDeliveryOrdersQuery,
  GetMyDeliveriesQuery,
  DeliveryPaginatedResult,
  UpdateDeliveryStatusInput,
} from "./delivery.type";
import { IOrder } from "../../models/order";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "../../utils/errors/app.error";
import logger from "../../config/logger.config";
import { emitStatusUpdate, emitAdminOrderEvent } from "../../socket/order";

/**
 * =========================================================
 * GET AVAILABLE DELIVERY ORDERS SERVICE
 * =========================================================
 */
export const getAvailableDeliveryOrdersService = async (
  query: GetAvailableDeliveryOrdersQuery,
): Promise<DeliveryPaginatedResult<IOrder>> => {
  return await findAvailableDeliveryOrdersRepo(query);
};

/**
 * =========================================================
 * ACCEPT / CLAIM DELIVERY ORDER SERVICE
 * =========================================================
 */
export const acceptDeliveryOrderService = async (
  orderId: string,
  deliveryPersonId: string,
): Promise<IOrder> => {
  const existingOrder = await findDeliveryOrderByIdRepo(orderId);

  if (existingOrder.orderType !== "delivery") {
    throw new BadRequestError("This order is not for delivery");
  }

  if (existingOrder.deliveryStatus !== "not_assigned") {
    throw new ConflictError(
      "This delivery order has already been accepted by another delivery partner",
    );
  }

  if (existingOrder.studentId._id.toString() === deliveryPersonId) {
    throw new BadRequestError("You cannot deliver your own order");
  }

  if (["completed", "cancelled", "rejected"].includes(existingOrder.status)) {
    throw new BadRequestError(
      `Cannot accept delivery for order in '${existingOrder.status}' status`,
    );
  }

  const updatedOrder = await claimDeliveryOrderRepo(orderId, deliveryPersonId);

  if (!updatedOrder) {
    throw new ConflictError(
      "Failed to accept delivery. It may have been claimed by someone else.",
    );
  }

  logger.info("Delivery order accepted", {
    orderId,
    deliveryPersonId,
  });

  // Real-time socket notification to ordering student
  emitStatusUpdate(updatedOrder.studentId._id.toString(), {
    orderId: updatedOrder._id.toString(),
    status: updatedOrder.status,
    deliveryStatus: updatedOrder.deliveryStatus || undefined,
    message: "A delivery partner has been assigned to your order.",
  });

  // Real-time socket event for Admin dashboard
  emitAdminOrderEvent("admin:orderUpdated", {
    orderId: updatedOrder._id.toString(),
    deliveryStatus: updatedOrder.deliveryStatus,
  });

  return updatedOrder;
};

/**
 * =========================================================
 * GET MY DELIVERIES SERVICE
 * =========================================================
 */
export const getMyDeliveriesService = async (
  deliveryPersonId: string,
  query: GetMyDeliveriesQuery,
): Promise<DeliveryPaginatedResult<IOrder>> => {
  return await findStudentDeliveriesRepo(deliveryPersonId, query);
};

/**
 * =========================================================
 * GET DELIVERY ORDER BY ID SERVICE
 * =========================================================
 */
export const getDeliveryOrderByIdService = async (
  orderId: string,
  deliveryPersonId: string,
): Promise<IOrder> => {
  const order = await findDeliveryOrderByIdRepo(orderId);

  const isAssignedPerson =
    order.deliveryPersonId &&
    order.deliveryPersonId._id.toString() === deliveryPersonId;
  const isUnassignedAvailable =
    order.deliveryStatus === "not_assigned" && order.orderType === "delivery";

  if (!isAssignedPerson && !isUnassignedAvailable) {
    throw new ForbiddenError("You are not authorized to view this delivery order");
  }

  return order;
};

/**
 * =========================================================
 * UPDATE DELIVERY STATUS SERVICE
 * =========================================================
 */
export const updateDeliveryStatusService = async (
  input: UpdateDeliveryStatusInput,
): Promise<IOrder> => {
  const { orderId, deliveryPersonId, status } = input;

  const existingOrder = await findDeliveryOrderByIdRepo(orderId);

  if (
    !existingOrder.deliveryPersonId ||
    existingOrder.deliveryPersonId._id.toString() !== deliveryPersonId
  ) {
    throw new ForbiddenError(
      "You are not assigned as the delivery partner for this order",
    );
  }

  // Validate state transitions
  if (status === "out_for_delivery") {
    if (existingOrder.deliveryStatus !== "assigned") {
      throw new BadRequestError(
        `Cannot change delivery status to 'out_for_delivery' from '${existingOrder.deliveryStatus}'`,
      );
    }
  } else if (status === "delivered") {
    if (existingOrder.deliveryStatus !== "out_for_delivery") {
      throw new BadRequestError(
        `Cannot mark delivery as 'delivered' when current status is '${existingOrder.deliveryStatus}'. Order must be 'out_for_delivery' first.`,
      );
    }
  }

  const updatedOrder = await updateDeliveryStatusInDbRepo(
    orderId,
    deliveryPersonId,
    status,
  );

  if (!updatedOrder) {
    throw new BadRequestError("Failed to update delivery status");
  }

  logger.info("Delivery status updated", {
    orderId,
    deliveryPersonId,
    newStatus: status,
  });

  const message =
    status === "out_for_delivery"
      ? "Your order is out for delivery! The delivery partner is on the way."
      : "Your order has been delivered! Enjoy your food.";

  // Emit socket updates to customer student
  emitStatusUpdate(updatedOrder.studentId._id.toString(), {
    orderId: updatedOrder._id.toString(),
    status: updatedOrder.status,
    deliveryStatus: updatedOrder.deliveryStatus || undefined,
    message,
  });

  // Emit admin socket update
  emitAdminOrderEvent("admin:orderUpdated", {
    orderId: updatedOrder._id.toString(),
    status: updatedOrder.status,
    deliveryStatus: updatedOrder.deliveryStatus,
  });

  return updatedOrder;
};

/**
 * =========================================================
 * CANCEL DELIVERY ASSIGNMENT SERVICE
 * =========================================================
 */
export const cancelDeliveryAssignmentService = async (
  orderId: string,
  deliveryPersonId: string,
): Promise<IOrder> => {
  const existingOrder = await findDeliveryOrderByIdRepo(orderId);

  if (
    !existingOrder.deliveryPersonId ||
    existingOrder.deliveryPersonId._id.toString() !== deliveryPersonId
  ) {
    throw new ForbiddenError(
      "You are not assigned as the delivery partner for this order",
    );
  }

  if (existingOrder.deliveryStatus !== "assigned") {
    throw new BadRequestError(
      "Cannot cancel delivery assignment after order has been picked up or delivered",
    );
  }

  const updatedOrder = await cancelDeliveryAssignmentRepo(
    orderId,
    deliveryPersonId,
  );

  if (!updatedOrder) {
    throw new BadRequestError("Failed to cancel delivery assignment");
  }

  logger.info("Delivery assignment cancelled by partner", {
    orderId,
    deliveryPersonId,
  });

  return updatedOrder;
};
