import {
  createOrderRepo,
  findOrderByIdRepo,
  findOrderByOrderNumberRepo,
  findOrdersByStudentRepo,
  updateOrderStatusRepo,
  cancelOrderRepo,
  findOrderByOrderNumberForPaymentRepo,
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
import {
  createCashfreeOrder,
  verifyCashfreeOrder,
} from "../../config/cashfree.config";

const DEFAULT_DELIVERY_CHARGE = 29;

/**
 * =========================================================
 * CREATED ORDERS BY STUDENT
 * =========================================================
 */
export const createOrderService = async (
  input: CreateOrderInput,
): Promise<{ order: IOrder; paymentSessionId?: string }> => {
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

  const notifyCafeAndAdminOfNewOrder = () => {
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
  };

  if (paymentMethod === "cash") {
    notifyCafeAndAdminOfNewOrder();
  }

  let paymentSessionId: string | undefined;

  if (paymentMethod !== "cash") {
    try {
      const cfOrder = await createCashfreeOrder({
        orderId: order.orderNumber,
        amount: totalAmount,
        customerId: studentId,
        customerPhone: (order.studentId as any)?.phone || "9999999999",
        customerEmail: (order.studentId as any)?.email,
        customerName: (order.studentId as any)?.name,
      });

      paymentSessionId = cfOrder.payment_session_id;

      await updateOrderStatusRepo(order._id.toString(), order.status, {
        paymentId: cfOrder.cf_order_id,
      } as any);
    } catch (error) {
      logger.error("Cashfree order creation failed", {
        orderId: order._id,
        orderNumber: order.orderNumber,
        error,
      });

      await updateOrderStatusRepo(order._id.toString(), "cancelled", {
        cancellationReason: "Payment session creation failed",
        cancelledBy: "super_admin",
      } as any);

      throw new BadRequestError(
        "Unable to initiate payment. Please try again.",
      );
    }
  }

  return { order, paymentSessionId };
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
 * GET SINGLE ORDER BY ORDER NUMBER
 * =========================================================
 */
export const getOrderByNumberForStudentService = async (
  orderNumber: string,
  studentId: string,
): Promise<IOrder> => {
  return await findOrderByOrderNumberRepo(orderNumber, studentId);
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

  console.log(order.status);

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

/**
 * =========================================================
 * MARK ORDER PAID
 * =========================================================
 */
export const markOrderPaidByOrderNumberService = async (
  orderNumber: string,
): Promise<IOrder> => {
  const order = await findOrderByOrderNumberForPaymentRepo(orderNumber);

  if (!order) {
    throw new NotFoundError("Order not found for this payment.");
  }

  if (["cancelled", "rejected"].includes(order.status)) {
    logger.warn("Payment webhook received for a cancelled/rejected order", {
      orderNumber,
      status: order.status,
    });
    return order;
  }

  if (order.paymentStatus === "paid") {
    return order;
  }

  const updatedOrder = await updateOrderStatusRepo(
    order._id.toString(),
    "accepted" as OrderStatus,
    { paymentStatus: "paid" } as any,
  );

  logger.info("Order marked as paid via Cashfree webhook", {
    orderNumber,
    orderId: order._id,
  });

  const studentIdStr = (updatedOrder.studentId as any)?._id
    ? (updatedOrder.studentId as any)._id.toString()
    : updatedOrder.studentId.toString();

  emitStatusUpdate(studentIdStr, {
    orderId: updatedOrder._id.toString(),
    status: updatedOrder.status,
    message: "Payment received! Your order has been confirmed.",
  });

  emitNewOrderToCafe(updatedOrder.cafeId.toString(), {
    orderId: updatedOrder._id,
    orderNumber: updatedOrder.orderNumber,
    studentId: updatedOrder.studentId,
    studentName: (updatedOrder.studentId as any)?.name,
    studentContact: (updatedOrder.studentId as any)?.phone,
    items: updatedOrder.items,
    totalAmount: updatedOrder.totalAmount,
    notes: updatedOrder.notes,
    orderType: updatedOrder.orderType,
    pickupCode:
      updatedOrder.orderType === "pickup" ? updatedOrder.pickupCode : undefined,
    deliveryAddress:
      updatedOrder.orderType === "delivery"
        ? updatedOrder.deliveryAddress
        : undefined,
    createdAt: updatedOrder.createdAt,
  });

  emitAdminOrderEvent("admin:order:new", {
    orderId: updatedOrder._id,
    orderNumber: updatedOrder.orderNumber,
    cafeId: updatedOrder.cafeId.toString(),
    studentId: studentIdStr,
    orderType: updatedOrder.orderType,
    totalAmount: updatedOrder.totalAmount,
  });

  return updatedOrder;
};

/**
 * =========================================================
 * VERIFY & SYNC PAYMENT
 * =========================================================
 */
export const verifyAndSyncOrderPaymentService = async (
  orderNumber: string,
  studentId: string,
): Promise<IOrder> => {
  const order = await findOrderByOrderNumberForPaymentRepo(
    orderNumber,
    studentId,
  );

  if (!order) {
    throw new NotFoundError("Order not found.");
  }

  if (order.paymentStatus === "paid") {
    return order;
  }

  if (order.paymentMethod === "cash") {
    return order;
  }

  if (!order.paymentId) {
    logger.warn("No Cashfree payment ID found for order", { orderNumber });
    return order;
  }

  const cfOrder = await verifyCashfreeOrder(order.paymentId);

  logger.info("Manual payment verification checked", {
    orderNumber,
    cfStatus: cfOrder.order_status,
  });

  if (cfOrder.order_status === "PAID") {
    return await markOrderPaidByOrderNumberService(orderNumber);
  }

  return order;
};
