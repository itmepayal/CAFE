import {
  findApprovedCafes,
  findCafeByUserId,
  updateCafeByUserId,
  toggleCafeOpen,
  createMenuItemRepo,
  findMenuItemByIdRepo,
  updateMenuItemRepo,
  deleteMenuItemRepo,
  saveMenuItemRepo,
  findMyComplaints,
  findMenuItemsByCafeId,
  findOrdersByCafeId,
  findOrderByCafeIdAndOrderId,
  updateOrderStatusRepo,
  findExpiredPendingOrders,
} from "./owner.repository";
import {
  emitStatusUpdate,
  emitOrderReady,
  emitOrderCancelled,
  emitAdminOrderEvent,
} from "../../socket/order";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/errors/app.error";
import { IOrder } from "../../models/order";
import { GetCafeOrdersOptions } from "./owner.type";
import { generatePickupCode, pick } from "../../utils/pick/pick";
import {
  ALLOWED_UPDATE_FIELDS,
  ORDER_AUTO_CANCEL_MINUTES,
  ORDER_STATUS_TRANSITIONS,
  STATUS_MESSAGES,
} from "../../constants";
import { logger } from "../../config/logger.config";
import { cancelOrderRepo } from "../order/order.repository"; // single source of truth

// =========================================
// GET ALL APPROVED CAFES
// =========================================
export const getApprovedCafesService = async (
  search?: string,
  city?: string,
  page: number = 1,
  limit: number = 10,
) => {
  return await findApprovedCafes(search, city, page, limit);
};

// =========================================
// GET MY CAFE
// =========================================
export const getMyCafeService = async (userId: string) => {
  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found for this user");
  }

  return cafe;
};

// =========================================
// UPDATE MY CAFE
// =========================================
export const updateMyCafeService = async (userId: string, payload: any) => {
  const updated = await updateCafeByUserId(userId, payload);

  if (!updated) {
    throw new NotFoundError("Cafe not found or update failed");
  }

  return updated;
};

// =========================================
// TOGGLE OPEN / CLOSE CAFE
// =========================================
export const toggleCafeOpenService = async (userId: string) => {
  const cafe = await toggleCafeOpen(userId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  return cafe;
};

/**
 * =========================================================
 * CREATE MENU ITEM
 * =========================================================
 */
export const createMenuItemService = async (userId: string, payload: any) => {
  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  if (payload.discountedPrice && payload.discountedPrice >= payload.price) {
    throw new BadRequestError("Discounted price must be less than price");
  }

  return createMenuItemRepo({
    ...payload,
    cafeId: cafe._id,
  });
};

/**
 * =========================================================
 * GET ALL MENU ITEM
 * =========================================================
 */
export const getMyMenuItemsService = async (userId: string) => {
  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  return await findMenuItemsByCafeId(cafe._id.toString());
};

/**
 * =========================================================
 * UPDATE MENU ITEM
 * =========================================================
 */
export const updateMenuItemService = async (
  userId: string,
  itemId: string,
  payload: any,
) => {
  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  const item = await findMenuItemByIdRepo(itemId);

  if (!item) {
    throw new NotFoundError("Menu item not found");
  }

  if (item.cafeId.toString() !== cafe._id.toString()) {
    throw new ForbiddenError("You are not allowed to update this menu item");
  }

  const updatePayload = pick(payload, ALLOWED_UPDATE_FIELDS);

  const price = updatePayload.price ?? item.price;
  const discountedPrice = updatePayload.discountedPrice ?? item.discountedPrice;

  if (discountedPrice !== undefined && discountedPrice >= price) {
    throw new BadRequestError("Discounted price must be less than price");
  }

  return updateMenuItemRepo(itemId, updatePayload);
};

/**
 * =========================================================
 * DELETE MENU ITEM
 * =========================================================
 */
export const deleteMenuItemService = async (userId: string, itemId: string) => {
  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  const item = await findMenuItemByIdRepo(itemId);

  if (!item) {
    throw new NotFoundError("Menu item not found");
  }

  if (item.cafeId.toString() !== cafe._id.toString()) {
    throw new ForbiddenError("You are not allowed to delete this menu item");
  }

  return deleteMenuItemRepo(itemId);
};

/**
 * =========================================================
 * TOGGLE MENU AVAILABILITY
 * =========================================================
 */
export const toggleMenuAvailabilityService = async (
  userId: string,
  itemId: string,
) => {
  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  const item = await findMenuItemByIdRepo(itemId);

  if (!item) {
    throw new NotFoundError("Menu item not found");
  }

  if (item.cafeId.toString() !== cafe._id.toString()) {
    throw new ForbiddenError("You are not allowed to update this menu item");
  }

  item.isAvailable = !item.isAvailable;

  return saveMenuItemRepo(item);
};

/**
 * =========================================================
 * MY CAFE ORDER SERVICE
 * =========================================================
 */
export const getMyCafeOrdersService = async (
  userId: string,
  options: GetCafeOrdersOptions,
) => {
  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  return findOrdersByCafeId(cafe._id.toString(), options);
};

/**
 * =========================================================
 * MY CAFE ORDER DETAIL SERVICE
 * =========================================================
 */
export const getCafeOrderDetailsService = async (
  userId: string,
  orderId: string,
) => {
  const cafe = await findCafeByUserId(userId);
  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }
  const order = await findOrderByCafeIdAndOrderId(cafe._id.toString(), orderId);
  if (!order) {
    throw new NotFoundError("Order not found");
  }
  return order;
};

/**
 * =========================================================
 * UPDATE ORDER STATUS
 * =========================================================
 */
export const updateOrderStatusService = async (
  userId: string,
  orderId: string,
  status: IOrder["status"],
) => {
  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  const order = await findOrderByCafeIdAndOrderId(cafe._id.toString(), orderId);

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  const currentStatus = order.status;
  const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[currentStatus];

  if (!allowedNextStatuses) {
    throw new BadRequestError(`Unknown order status: ${currentStatus}`);
  }

  if (allowedNextStatuses.length === 0) {
    throw new BadRequestError(`Cannot update a ${currentStatus} order`);
  }

  if (currentStatus === status) {
    throw new BadRequestError(`Order is already ${status}`);
  }

  if (!allowedNextStatuses.includes(status)) {
    throw new BadRequestError(
      `Invalid status transition from ${currentStatus} to ${status}. Allowed: ${allowedNextStatuses.join(", ")}`,
    );
  }

  const updatedOrder = await updateOrderStatusRepo(
    orderId,
    cafe._id.toString(),
    status,
  );

  if (!updatedOrder) {
    throw new NotFoundError("Order not found");
  }

  const studentId = order.studentId.toString();

  switch (status) {
    case "accepted":
      updatedOrder.acceptedAt = new Date();
      break;

    case "preparing":
      updatedOrder.preparingAt = new Date();
      break;

    case "ready":
      updatedOrder.readyAt = new Date();

      if (!updatedOrder.pickupCode) {
        updatedOrder.pickupCode = generatePickupCode();
      }

      break;

    case "completed":
      updatedOrder.completedAt = new Date();
      break;

    case "cancelled":
      updatedOrder.cancelledAt = new Date();
      updatedOrder.cancelledBy = "cafe";
      updatedOrder.cancellationReason = "Cancelled by cafe";
      break;
  }

  updatedOrder.statusHistory.push({
    status,
    changedAt: new Date(),
  });

  await updatedOrder.save();

  if (status === "ready") {
    emitOrderReady(studentId, {
      orderId: updatedOrder._id.toString(),
      pickupCode: updatedOrder.pickupCode,
    });
  } else if (status === "cancelled") {
    emitOrderCancelled(studentId, {
      orderId: updatedOrder._id.toString(),
      reason: updatedOrder.cancellationReason,
      cancelledBy: "cafe",
    });
  } else {
    emitStatusUpdate(studentId, {
      orderId: updatedOrder._id.toString(),
      status,
      estimatedReadyTime: updatedOrder.estimatedReadyTime,
      message: `Your order is now ${status}`,
    });
  }

  return updatedOrder;
};

/**
 * =========================================================
 * AUTO ORDER CANCEL
 * =========================================================
 */
export const autoCancelStaleOrdersService = async (): Promise<void> => {
  const cutoffDate = new Date(
    Date.now() - ORDER_AUTO_CANCEL_MINUTES * 60 * 1000,
  );

  const staleOrders = await findExpiredPendingOrders(cutoffDate);

  if (staleOrders.length === 0) {
    return;
  }

  logger.info(`Auto-cancelling ${staleOrders.length} stale pending order(s)`);

  for (const order of staleOrders) {
    try {
      const reason = "Cafe did not respond in time";

      await cancelOrderRepo(order._id.toString(), "super_admin", reason);

      const studentId = order.studentId.toString();

      emitOrderCancelled(studentId, {
        orderId: order._id.toString(),
        reason,
        cancelledBy: "admin",
      });

      emitStatusUpdate(studentId, {
        orderId: order._id.toString(),
        status: "cancelled",
        message: STATUS_MESSAGES["cancelled"],
      });

      emitAdminOrderEvent("admin:order:auto_cancelled", {
        orderId: order._id.toString(),
        cafeId: order.cafeId.toString(),
        studentId,
        reason,
      });

      logger.info("Order auto-cancelled due to timeout", {
        orderId: order._id,
        cafeId: order.cafeId,
      });
    } catch (error) {
      logger.error("Failed to auto-cancel order", {
        orderId: order._id,
        error,
      });
    }
  }
};

// =========================================
// GET MY COMPLAINTS SERVICE
// =========================================
export const getMyComplaintsService = async (
  userId: string,
  status?: string,
  category?: string,
  page?: number,
  limit?: number,
) => {
  return await findMyComplaints(userId, status, category, page, limit);
};
