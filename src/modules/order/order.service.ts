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
} from "../../socket/order";
import { IOrder, IOrderItem } from "../../models/order";
import logger from "../../config/logger.config";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/errors/app.error";
import {
  CANCELLABLE_STATUSES,
  STATUS_MESSAGES,
  PAYMENT_METHODS,
  ORDER_TYPES,
  OrderStatus,
} from "./order.constant";
import {
  CancelOrderInput,
  CreateOrderInput,
  RateOrderInput,
} from "./order.type";
import { findCafeById } from "../cafes/cafe.repository";
import { findMenuItemByIdRepo } from "../menu/menu.repository";

const DEFAULT_DELIVERY_CHARGE = 20;

/**
 * =========================================================
 * CREATED ORDERS BY STUDENT
 * =========================================================
 */
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
    orderType = "pickup",
    deliveryAddress,
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

  if (!ORDER_TYPES.includes(orderType as (typeof ORDER_TYPES)[number])) {
    throw new BadRequestError(
      `Invalid order type. Allowed: ${ORDER_TYPES.join(", ")}`,
    );
  }

  if (orderType === "delivery") {
    if (
      !deliveryAddress ||
      !deliveryAddress.fullAddress?.trim() ||
      !deliveryAddress.contactNumber?.trim()
    ) {
      throw new BadRequestError(
        "Delivery address is required for delivery orders.",
      );
    }
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

  if (cafe.status != "approved") {
    throw new BadRequestError("This cafe is not approved.");
  }

  if (!cafe.isOpen) {
    throw new BadRequestError("This cafe is currently closed.");
  }

  if (orderType === "delivery" && !cafe.supportsDelivery) {
    throw new BadRequestError("This cafe does not offer delivery.");
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
      throw new BadRequestError(`"${menuItem.name}" not available`);
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

  const deliveryCharge = orderType == "delivery" ? DEFAULT_DELIVERY_CHARGE : 0;

  if (discountAmount > subtotal) {
    throw new BadRequestError(
      "The discount amount cannot exceed the order subtotal.",
    );
  }

  const totalAmount = parseFloat(
    (subtotal + taxAmount + deliveryCharge - discountAmount).toFixed(2),
  );

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
    deliveryCharge,
    totalAmount,
    paymentMethod: paymentMethod as IOrder["paymentMethod"],
    notes,
    paymentStatus: "pending",
    status: "pending",
    orderType: orderType as IOrder["orderType"],
    ...(orderType === "delivery"
      ? {
          deliveryAddress,
          deliveryStatus: "not_assigned",
        }
      : {}),
    statusHistory: [{ status: "pending", changedAt: new Date() }],
  });

  logger.info("Order created successfully", {
    orderId: order._id,
    orderNumber: order.orderNumber,
    studentId,
    cafeId,
    orderType,
    totalAmount,
  });

  emitNewOrderToCafe(cafeId, {
    orderId: order._id,
    orderNumber: order.orderNumber,
    studentId: order.studentId,
    studentName: (order.studentId as any)?.name,
    studentContact: (order.studentId as any)?.phone,
    items: order.items,
    totalAmount: order.totalAmount,
    notes: order.notes,
    orderType: order.orderType,
    pickupCode: order.orderType === "pickup" ? order.pickupCode : undefined,
    deliveryAddress:
      order.orderType === "delivery" ? order.deliveryAddress : undefined,
    createdAt: order.createdAt,
  });

  emitAdminOrderEvent("admin:order:new", {
    orderId: order._id,
    orderNumber: order.orderNumber,
    cafeId,
    studentId,
    orderType,
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
 * ASSIGN / UPDATE DELIVERY
 * =========================================================
 */
export const updateDeliveryStatusService = async (
  orderId: string,
  cafeId: string,
  deliveryStatus: NonNullable<IOrder["deliveryStatus"]>,
  deliveryPersonId?: string,
): Promise<IOrder> => {
  const order = await findOrderByIdRepo(orderId);

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  if (order.cafeId.toString() !== cafeId) {
    throw new ForbiddenError("You can only manage your own cafe's orders.");
  }

  if (order.orderType !== "delivery") {
    throw new BadRequestError("This order is not a delivery order.");
  }

  if (order.status === "cancelled" || order.status === "rejected") {
    throw new BadRequestError(
      `Cannot update delivery status. This order has already been ${order.status}.`,
    );
  }

  const allowedTransitions: Record<string, string[]> = {
    not_assigned: ["assigned"],
    assigned: ["out_for_delivery"],
    out_for_delivery: ["delivered"],
    delivered: [],
  };

  const currentStatus = order.deliveryStatus ?? "not_assigned";

  if (!allowedTransitions[currentStatus]?.includes(deliveryStatus)) {
    throw new BadRequestError(
      `Cannot move delivery status from '${currentStatus}' to '${deliveryStatus}'.`,
    );
  }

  if (deliveryStatus === "assigned" && !deliveryPersonId) {
    throw new BadRequestError(
      "deliveryPersonId is required when assigning a delivery order.",
    );
  }

  const update: Partial<IOrder> = {
    deliveryStatus,
    ...(deliveryPersonId ? { deliveryPersonId: deliveryPersonId as any } : {}),
    ...(deliveryStatus === "out_for_delivery"
      ? { status: "out_for_delivery", outForDeliveryAt: new Date() }
      : {}),
    ...(deliveryStatus === "delivered"
      ? { status: "completed", completedAt: new Date() }
      : {}),
  };

  const updatedOrder = await updateOrderStatusRepo(
    orderId,
    (update.status ?? order.status) as OrderStatus,
    update as any,
  );

  logger.info("Delivery status updated", {
    orderId,
    deliveryStatus,
    deliveryPersonId,
  });

  emitStatusUpdate(order.studentId.toString(), {
    orderId,
    status: update.status ?? order.status,
    deliveryStatus,
    message:
      deliveryStatus === "out_for_delivery"
        ? "Your order is out for delivery"
        : deliveryStatus === "delivered"
          ? "Your order has been delivered"
          : "Your delivery has been assigned",
  });

  return updatedOrder;
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

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  if (order.studentId._id.toString() !== studentId) {
    throw new ForbiddenError("You are only allowed to cancel your own orders.");
  }

  if (order.status === "cancelled") {
    throw new BadRequestError("This order has already been cancelled.");
  }

  if (!CANCELLABLE_STATUSES.includes(order.status as OrderStatus)) {
    throw new BadRequestError(
      `Orders with status '${order.status}' cannot be cancelled. Orders can only be cancelled when their status is: ${CANCELLABLE_STATUSES.join(", ")}.`,
    );
  }

  const minutesSinceOrder =
    (Date.now() - new Date(order.createdAt).getTime()) / (60 * 1000);

  if (minutesSinceOrder > 10) {
    throw new BadRequestError(
      "Cancellation window has expired. Orders can only be cancelled within 10 minutes of placing them.",
    );
  }

  const cancellationReason = reason.trim();

  if (!cancellationReason) {
    throw new BadRequestError("A cancellation reason is required.");
  }

  if (cancellationReason.length > 500) {
    throw new BadRequestError(
      "Cancellation reason cannot exceed 500 characters.",
    );
  }

  const shouldRefund = order.paymentStatus === "paid";

  const cancelledOrder = await cancelOrderRepo(
    orderId,
    "student",
    cancellationReason,
    shouldRefund,
  );

  logger.info("Order cancelled by student", {
    orderId,
    cancelledBy: "student",
    reason: cancellationReason,
    previousStatus: order.status,
    refunded: shouldRefund,
  });

  emitOrderCancelled(studentId, {
    orderId,
    reason: cancellationReason,
    cancelledBy: "student",
  });

  emitStatusUpdate(studentId, {
    orderId,
    status: "cancelled",
    message: shouldRefund
      ? "Your order has been cancelled. Refund will be processed shortly."
      : STATUS_MESSAGES.cancelled,
  });

  emitAdminOrderEvent("admin:order:cancelled", {
    orderId,
    cancelledBy: "student",
    reason: cancellationReason,
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

  if (order.studentId._id.toString() !== studentId) {
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
