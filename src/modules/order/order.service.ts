import {
  createOrderRepo,
  findOrderByIdRepo,
  findOrdersByStudentRepo,
  updateOrderStatusRepo,
  cancelOrderRepo,
} from "./order.repository";
import {
  emitNewOrderToCafe,
  emitStatusUpdate,
  emitOrderCancelled,
  emitAdminOrderEvent,
  OrderStatus,
} from "../../socket/order";
import { IOrder, IOrderItem } from "../../models/order";
import logger from "../../config/logger.config";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/errors/app.error";
import { CANCELLABLE_STATUSES, STATUS_MESSAGES } from "../../constants";
import {
  CancelOrderInput,
  CreateOrderInput,
  PAYMENT_METHODS,
  RateOrderInput,
} from "./order.type";
import { findCafeById } from "../cafes/cafe.repository";
import { findMenuItemByIdRepo } from "../menu/menu.repository";

export const createOrderService = async (
  input: CreateOrderInput,
): Promise<IOrder> => {
  const {
    studentId,
    cafeId,
    items,
    paymentMethod,
    notes = "",
    taxRate = 0.05,
    discountAmount = 0,
  } = input;

  if (!items || items.length === 0) {
    throw new BadRequestError("Order must contain at least one item.");
  }

  if (
    !PAYMENT_METHODS.includes(paymentMethod as (typeof PAYMENT_METHODS)[number])
  ) {
    throw new BadRequestError(
      `Invalid payment method. Allowed: ${PAYMENT_METHODS.join(", ")}`,
    );
  }

  for (const item of items) {
    if (!item.menuItemId) {
      throw new BadRequestError("Menu item ID is required.");
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new BadRequestError("Item quantity must be greater than zero.");
    }
  }

  const cafe = await findCafeById(cafeId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  if (!cafe.isApproved) {
    throw new BadRequestError("This cafe is not approved.");
  }

  if (!cafe.isOpen) {
    throw new BadRequestError("This cafe is currently closed.");
  }

  const menuItems = await Promise.all(
    items.map((item) => findMenuItemByIdRepo(item.menuItemId)),
  );

  const enrichedItems: IOrderItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const requestedItem = items[i];
    const menuItem = menuItems[i];

    if (!menuItem) {
      throw new NotFoundError(
        `Menu item ${requestedItem.menuItemId} not found`,
      );
    }

    if (menuItem.cafeId.toString() !== cafeId) {
      throw new BadRequestError(
        `The menu item "${menuItem.name}" does not belong to the selected cafe. An order can only contain items from a single cafe.`,
      );
    }

    if (!menuItem.isAvailable) {
      throw new BadRequestError(`"${menuItem.name}" abhi available nahi hai`);
    }

    const effectivePrice =
      menuItem.discountedPrice && menuItem.discountedPrice > 0
        ? menuItem.discountedPrice
        : menuItem.price;

    const itemSubtotal = parseFloat(
      (requestedItem.quantity * effectivePrice).toFixed(2),
    );

    enrichedItems.push({
      menuItemId: menuItem._id,
      itemName: menuItem.name,
      itemImage: menuItem.image ?? "",
      itemPrice: effectivePrice,
      quantity: requestedItem.quantity,
      subtotal: itemSubtotal,
      specialInstructions: requestedItem.specialInstructions ?? "",
    } as IOrderItem);
  }

  const subtotal = parseFloat(
    enrichedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2),
  );
  const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
  const totalAmount = parseFloat(
    (subtotal + taxAmount - discountAmount).toFixed(2),
  );

  if (discountAmount > subtotal) {
    throw new BadRequestError(
      "The discount amount cannot exceed the order subtotal.",
    );
  }

  if (totalAmount < 0) {
    throw new BadRequestError("The total order amount cannot be negative.");
  }

  const order = await createOrderRepo({
    studentId: studentId as any,
    cafeId: cafeId as any,
    items: enrichedItems,
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    paymentMethod: paymentMethod as IOrder["paymentMethod"],
    notes,
    paymentStatus: "pending",
    status: "pending",
    statusHistory: [{ status: "pending", changedAt: new Date() }],
  });

  logger.info("Order created successfully", {
    orderId: order._id,
    orderNumber: order.orderNumber,
    studentId,
    cafeId,
    totalAmount,
  });

  emitNewOrderToCafe(cafeId, {
    orderId: order._id,
    orderNumber: order.orderNumber,
    items: order.items,
    totalAmount: order.totalAmount,
    notes: order.notes,
    pickupCode: order.pickupCode,
    createdAt: order.createdAt,
  });

  emitAdminOrderEvent("admin:order:new", {
    orderId: order._id,
    orderNumber: order.orderNumber,
    cafeId,
    studentId,
    totalAmount,
  });

  return order;
};

/**
 * =========================================================
 * GET ORDERS BY STUDENT
 * =========================================================
 */
export const getStudentOrdersService = async (
  studentId: string,
): Promise<IOrder[]> => {
  return await findOrdersByStudentRepo(studentId);
};

/**
 * =========================================================
 * CANCEL ORDER
 * =========================================================
 */
export const cancelOrderService = async (
  input: CancelOrderInput,
): Promise<IOrder> => {
  const { orderId, studentId, reason } = input;

  const order = await findOrderByIdRepo(orderId);

  if (order.studentId.toString() !== studentId) {
    throw new ForbiddenError("You are only allowed to cancel your own orders.");
  }

  if (!CANCELLABLE_STATUSES.includes(order.status as OrderStatus)) {
    throw new BadRequestError(
      `Orders with status '${order.status}' cannot be cancelled. Orders can only be cancelled when their status is: ${CANCELLABLE_STATUSES.join(", ")}.`,
    );
  }

  if (!reason || reason.trim().length === 0) {
    throw new BadRequestError("A cancellation reason is required.");
  }

  if (reason.trim().length > 500) {
    throw new BadRequestError(
      "Cancellation reason cannot exceed 500 characters.",
    );
  }

  const cancelledOrder = await cancelOrderRepo(orderId, "student", reason);

  logger.info("Order cancelled", {
    orderId,
    cancelledBy: "student",
    reason,
    previousStatus: order.status,
  });

  emitOrderCancelled(studentId, {
    orderId,
    reason,
    cancelledBy: "student",
  });

  emitStatusUpdate(studentId, {
    orderId,
    status: "cancelled",
    message: STATUS_MESSAGES["cancelled"],
  });

  emitAdminOrderEvent("admin:order:cancelled", {
    orderId,
    cancelledBy: "student",
    reason,
    cafeId: order.cafeId.toString(),
    studentId,
  });

  return cancelledOrder;
};

/**
 * =========================================================
 * RATE ORDER
 * =========================================================
 */
export const rateOrderService = async (
  input: RateOrderInput,
): Promise<IOrder> => {
  const { orderId, studentId, stars, review = "" } = input;

  const order = await findOrderByIdRepo(orderId);

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  if (order.studentId.toString() !== studentId) {
    throw new ForbiddenError("You can only rate your own orders.");
  }

  if (order.status !== "completed") {
    throw new BadRequestError("Only completed orders can be rated.");
  }

  if (order.rating?.stars) {
    throw new BadRequestError("This order has already been rated.");
  }

  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new BadRequestError("Rating must be an integer between 1 and 5.");
  }

  if (review.trim().length > 500) {
    throw new BadRequestError("Review cannot exceed 500 characters.");
  }

  const updatedOrder = await updateOrderStatusRepo(
    orderId,
    order.status as OrderStatus,
    {
      rating: {
        stars,
        review,
        reviewedAt: new Date(),
      },
    } as any,
  );

  logger.info("Order rated", { orderId, studentId, stars });

  return updatedOrder;
};
