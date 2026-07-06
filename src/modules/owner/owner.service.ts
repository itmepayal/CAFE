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
} from "./owner.repository";
import {
  emitStatusUpdate,
  emitOrderReady,
  emitOrderCancelled,
} from "../../socket/order";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/errors/app.error";
import { IOrder } from "../../models/order";
import { GetCafeOrdersOptions } from "./owner.type";
import { generatePickupCode, pick } from "../../utils/pick/pick";
import { ORDER_STATUS_TRANSITIONS } from "../../constants";

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
// GET MY CAFE (OWNER)
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

const ALLOWED_UPDATE_FIELDS = [
  "name",
  "description",
  "price",
  "discountedPrice",
  "category",
  "image",
  "isAvailable",
  "preparationTime",
  "ingredients",
] as const;

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
