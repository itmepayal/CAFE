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
import Order, { IOrder } from "../../models/order";
import { GetCafeOrdersOptions } from "./owner.type";
import { generatePickupCode, pick } from "../../utils/pick/pick";
import {
  ALLOWED_UPDATE_FIELDS,
  ORDER_AUTO_CANCEL_MINUTES,
  ORDER_STATUS_TRANSITIONS,
  STATUS_MESSAGES,
} from "../../constants";
import { logger } from "../../config/logger.config";
import { cancelOrderRepo } from "../order/order.repository";

// =========================================
// GET ALL APPROVED CAFES
// =========================================
export const getApprovedCafesService = async (
  search?: string,
  city?: string,
  page: number = 1,
  limit: number = 10,
) => {
  logger.info("Fetching approved cafes", { search, city, page, limit });

  const result = await findApprovedCafes(search, city, page, limit);

  logger.info("Fetched approved cafes successfully", {
    count: Array.isArray((result as any)?.data)
      ? (result as any).data.length
      : undefined,
  });

  return result;
};

// =========================================
// GET MY CAFE
// =========================================
export const getMyCafeService = async (userId: string) => {
  logger.info("Fetching cafe for user", { userId });

  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    logger.warn("Cafe not found for user", { userId });
    throw new NotFoundError("Cafe not found for this user");
  }

  logger.info("Cafe fetched successfully", { userId, cafeId: cafe._id });

  return cafe;
};

// =========================================
// UPDATE MY CAFE
// =========================================
export const updateMyCafeService = async (userId: string, payload: any) => {
  logger.info("Updating cafe for user", { userId, payload });

  const updated = await updateCafeByUserId(userId, payload);

  if (!updated) {
    logger.warn("Cafe not found or update failed", { userId });
    throw new NotFoundError("Cafe not found or update failed");
  }

  logger.info("Cafe updated successfully", { userId, cafeId: updated._id });

  return updated;
};

// =========================================
// TOGGLE OPEN / CLOSE CAFE
// =========================================
export const toggleCafeOpenService = async (userId: string) => {
  logger.info("Toggling cafe open/close status", { userId });

  const cafe = await toggleCafeOpen(userId);

  if (!cafe) {
    logger.warn("Cafe not found while toggling open status", { userId });
    throw new NotFoundError("Cafe not found");
  }

  logger.info("Cafe open status toggled successfully", {
    userId,
    cafeId: cafe._id,
    isOpen: (cafe as any).isOpen,
  });

  return cafe;
};

/**
 * =========================================================
 * CREATE MENU ITEM
 * =========================================================
 */
export const createMenuItemService = async (userId: string, payload: any) => {
  logger.info("Creating menu item", { userId, payload });

  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    logger.warn("Cafe not found while creating menu item", { userId });
    throw new NotFoundError("Cafe not found");
  }

  if (payload.discountedPrice && payload.discountedPrice >= payload.price) {
    logger.warn("Invalid discounted price on menu item creation", {
      userId,
      cafeId: cafe._id,
      price: payload.price,
      discountedPrice: payload.discountedPrice,
    });
    throw new BadRequestError("Discounted price must be less than price");
  }

  const menuItem = await createMenuItemRepo({
    ...payload,
    cafeId: cafe._id,
  });

  logger.info("Menu item created successfully", {
    userId,
    cafeId: cafe._id,
    menuItemId: menuItem._id,
  });

  return menuItem;
};

/**
 * =========================================================
 * GET ALL MENU ITEM
 * =========================================================
 */
export const getMyMenuItemsService = async (userId: string) => {
  logger.info("Fetching menu items for cafe owner", { userId });

  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    logger.warn("Cafe not found while fetching menu items", { userId });
    throw new NotFoundError("Cafe not found");
  }

  const items = await findMenuItemsByCafeId(cafe._id.toString());

  logger.info("Menu items fetched successfully", {
    userId,
    cafeId: cafe._id,
    count: items.length,
  });

  return items;
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
  logger.info("Updating menu item", { userId, itemId, payload });

  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    logger.warn("Cafe not found while updating menu item", { userId, itemId });
    throw new NotFoundError("Cafe not found");
  }

  const item = await findMenuItemByIdRepo(itemId);

  if (!item) {
    logger.warn("Menu item not found", { userId, itemId });
    throw new NotFoundError("Menu item not found");
  }

  if (item.cafeId.toString() !== cafe._id.toString()) {
    logger.warn("Unauthorized menu item update attempt", {
      userId,
      itemId,
      cafeId: cafe._id,
      itemCafeId: item.cafeId,
    });
    throw new ForbiddenError("You are not allowed to update this menu item");
  }

  const updatePayload = pick(payload, ALLOWED_UPDATE_FIELDS);

  const price = updatePayload.price ?? item.price;
  const discountedPrice = updatePayload.discountedPrice ?? item.discountedPrice;

  if (discountedPrice !== undefined && discountedPrice >= price) {
    logger.warn("Invalid discounted price on menu item update", {
      userId,
      itemId,
      price,
      discountedPrice,
    });
    throw new BadRequestError("Discounted price must be less than price");
  }

  const updatedItem = await updateMenuItemRepo(itemId, updatePayload);

  logger.info("Menu item updated successfully", {
    userId,
    itemId,
    cafeId: cafe._id,
  });

  return updatedItem;
};

/**
 * =========================================================
 * DELETE MENU ITEM
 * =========================================================
 */
export const deleteMenuItemService = async (userId: string, itemId: string) => {
  logger.info("Deleting menu item", { userId, itemId });

  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    logger.warn("Cafe not found while deleting menu item", { userId, itemId });
    throw new NotFoundError("Cafe not found");
  }

  const item = await findMenuItemByIdRepo(itemId);

  if (!item) {
    logger.warn("Menu item not found for deletion", { userId, itemId });
    throw new NotFoundError("Menu item not found");
  }

  if (item.cafeId.toString() !== cafe._id.toString()) {
    logger.warn("Unauthorized menu item deletion attempt", {
      userId,
      itemId,
      cafeId: cafe._id,
      itemCafeId: item.cafeId,
    });
    throw new ForbiddenError("You are not allowed to delete this menu item");
  }

  const result = await deleteMenuItemRepo(itemId);

  logger.info("Menu item deleted successfully", {
    userId,
    itemId,
    cafeId: cafe._id,
  });

  return result;
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
  logger.info("Toggling menu item availability", { userId, itemId });

  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    logger.warn("Cafe not found while toggling menu availability", {
      userId,
      itemId,
    });
    throw new NotFoundError("Cafe not found");
  }

  const item = await findMenuItemByIdRepo(itemId);

  if (!item) {
    logger.warn("Menu item not found while toggling availability", {
      userId,
      itemId,
    });
    throw new NotFoundError("Menu item not found");
  }

  if (item.cafeId.toString() !== cafe._id.toString()) {
    logger.warn("Unauthorized menu item availability toggle attempt", {
      userId,
      itemId,
      cafeId: cafe._id,
      itemCafeId: item.cafeId,
    });
    throw new ForbiddenError("You are not allowed to update this menu item");
  }

  item.isAvailable = !item.isAvailable;

  const savedItem = await saveMenuItemRepo(item);

  logger.info("Menu item availability toggled successfully", {
    userId,
    itemId,
    cafeId: cafe._id,
    isAvailable: savedItem.isAvailable,
  });

  return savedItem;
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
  logger.info("Fetching cafe orders", { userId, options });

  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    logger.warn("Cafe not found while fetching cafe orders", { userId });
    throw new NotFoundError("Cafe not found");
  }

  const orders = await findOrdersByCafeId(cafe._id.toString(), options);

  logger.info("Cafe orders fetched successfully", {
    userId,
    cafeId: cafe._id,
  });

  return orders;
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
  logger.info("Fetching cafe order details", { userId, orderId });

  const cafe = await findCafeByUserId(userId);
  if (!cafe) {
    logger.warn("Cafe not found while fetching order details", {
      userId,
      orderId,
    });
    throw new NotFoundError("Cafe not found");
  }
  const order = await findOrderByCafeIdAndOrderId(cafe._id.toString(), orderId);
  if (!order) {
    logger.warn("Order not found", { userId, cafeId: cafe._id, orderId });
    throw new NotFoundError("Order not found");
  }

  logger.info("Cafe order details fetched successfully", {
    userId,
    cafeId: cafe._id,
    orderId,
  });

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
  logger.info("Updating order status", { userId, orderId, status });

  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    logger.warn("Cafe not found while updating order status", {
      userId,
      orderId,
    });
    throw new NotFoundError("Cafe not found");
  }

  const order = await findOrderByCafeIdAndOrderId(cafe._id.toString(), orderId);

  if (!order) {
    logger.warn("Order not found while updating status", {
      userId,
      cafeId: cafe._id,
      orderId,
    });
    throw new NotFoundError("Order not found");
  }

  const currentStatus = order.status;
  const allowedNextStatuses = ORDER_STATUS_TRANSITIONS[currentStatus];

  if (!allowedNextStatuses) {
    logger.error("Unknown order status encountered", {
      userId,
      orderId,
      currentStatus,
    });
    throw new BadRequestError(`Unknown order status: ${currentStatus}`);
  }

  if (allowedNextStatuses.length === 0) {
    logger.warn("Attempted to update a terminal-status order", {
      userId,
      orderId,
      currentStatus,
    });
    throw new BadRequestError(`Cannot update a ${currentStatus} order`);
  }

  if (currentStatus === status) {
    logger.warn("Order status update requested with same status", {
      userId,
      orderId,
      status,
    });
    throw new BadRequestError(`Order is already ${status}`);
  }

  if (!allowedNextStatuses.includes(status)) {
    logger.warn("Invalid order status transition attempted", {
      userId,
      orderId,
      currentStatus,
      requestedStatus: status,
      allowedNextStatuses,
    });
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
    logger.warn("Order not found after status update attempt", {
      userId,
      cafeId: cafe._id,
      orderId,
    });
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
      updatedOrder.cancelledBy = "cafe_owner";
      updatedOrder.cancellationReason = "Cancelled by cafe";
      break;
  }

  updatedOrder.statusHistory.push({
    status,
    changedAt: new Date(),
  });

  await updatedOrder.save();

  logger.info("Order status updated successfully", {
    userId,
    cafeId: cafe._id,
    orderId,
    previousStatus: currentStatus,
    newStatus: status,
  });

  if (status === "ready") {
    emitOrderReady(studentId, {
      orderId: updatedOrder._id.toString(),
      pickupCode: updatedOrder.pickupCode,
    });
    logger.info("Order ready event emitted", {
      orderId: updatedOrder._id,
      studentId,
    });
  } else if (status === "cancelled") {
    emitOrderCancelled(studentId, {
      orderId: updatedOrder._id.toString(),
      reason: updatedOrder.cancellationReason,
      cancelledBy: "cafe",
    });
    logger.info("Order cancelled event emitted", {
      orderId: updatedOrder._id,
      studentId,
      reason: updatedOrder.cancellationReason,
    });
  } else {
    emitStatusUpdate(studentId, {
      orderId: updatedOrder._id.toString(),
      status,
      estimatedReadyTime: updatedOrder.estimatedReadyTime,
      message: `Your order is now ${status}`,
    });
    logger.info("Order status update event emitted", {
      orderId: updatedOrder._id,
      studentId,
      status,
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
  logger.info("Running auto-cancel stale orders job");

  const cutoffDate = new Date(
    Date.now() - ORDER_AUTO_CANCEL_MINUTES * 60 * 1000,
  );

  const staleOrders = await findExpiredPendingOrders(cutoffDate);

  if (staleOrders.length === 0) {
    logger.info("No stale pending orders found", { cutoffDate });
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

  logger.info("Auto-cancel stale orders job completed", {
    processedCount: staleOrders.length,
  });
};

/**
 * =========================================================
 * CANCEL ORDER CANCEL
 * =========================================================
 */
export const cancelSpecificStaleOrderService = async (
  orderId: string,
): Promise<void> => {
  logger.info("Cancelling specific stale order", { orderId });

  const order = await Order.findById(orderId);

  if (!order) {
    logger.warn("Order not found for manual cancellation", { orderId });
    throw new NotFoundError("Order not found.");
  }

  const cancellableStatuses = ["pending", "accepted"];

  if (!cancellableStatuses.includes(order.status)) {
    logger.warn("Order cannot be cancelled due to invalid status", {
      orderId,
      status: order.status,
    });
    throw new BadRequestError("Order cannot be cancelled");
  }

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

  logger.info("Specific order auto-cancelled manually", {
    orderId: order._id,
    cafeId: order.cafeId,
  });
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
  logger.info("Fetching complaints for user", {
    userId,
    status,
    category,
    page,
    limit,
  });

  const result = await findMyComplaints(userId, status, category, page, limit);

  logger.info("Complaints fetched successfully", { userId });

  return result;
};
