import {
  createOrderRepo,
  findOrderByIdRepo,
  findOrdersByStudentRepo,
  findOrdersByCafeRepo,
  updateOrderStatusRepo,
  cancelOrderRepo,
} from "./order.repository";

import {
  emitNewOrderToCafe,
  emitStatusUpdate,
  emitOrderReady,
  emitOrderCancelled,
  emitAdminOrderEvent,
  OrderStatus,
} from "../../socket/order";

import { IOrder, IOrderItem } from "../../models/order";
import logger from "../../config/logger.config";
import { BadRequestError, ForbiddenError } from "../../utils/errors/app.error";

/**
 * =========================================================
 * CONSTANTS
 * =========================================================
 */
const STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending: "Order place ho gaya, cafe ka wait karo ⏳",
  accepted: "Cafe ne tumhara order accept kar liya! 🎉",
  rejected: "Cafe ne order reject kar diya.",
  preparing: "Tumhara khana ban raha hai... 👨‍🍳",
  ready: "Order ready hai! Pickup karo 🔔",
  completed: "Order complete! Enjoy your meal 😊",
  cancelled: "Tumhara order cancel ho gaya.",
};

const TIMESTAMP_FIELDS: Partial<Record<OrderStatus, keyof IOrder>> = {
  accepted: "acceptedAt",
  preparing: "preparingAt",
  ready: "readyAt",
  completed: "completedAt",
  cancelled: "cancelledAt",
};

const VALID_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["accepted", "rejected"],
  accepted: ["preparing"],
  preparing: ["ready"],
  ready: ["completed"],
};

const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "accepted"];

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */
const calculateSubtotal = (items: IOrderItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity * item.itemPrice, 0);

const validateTransition = (current: OrderStatus, next: OrderStatus): void => {
  const allowed = VALID_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new BadRequestError(
      `Order status '${current}' se '${next}' mein change nahi ho sakta. Allowed: [${allowed.join(", ")}]`,
    );
  }
};

/**
 * =========================================================
 * CREATE ORDER
 * =========================================================
 */

export interface CreateOrderInput {
  studentId: string;
  cafeId: string;
  items: IOrderItem[];
  paymentMethod: IOrder["paymentMethod"];
  notes?: string;
  taxRate?: number;
  discountAmount?: number;
}

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
    throw new BadRequestError("Order mein kam se kam ek item hona chahiye");
  }

  const subtotal = calculateSubtotal(items);
  const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
  const totalAmount = parseFloat(
    (subtotal + taxAmount - discountAmount).toFixed(2),
  );

  const enrichedItems: IOrderItem[] = items.map((item) => ({
    ...item,
    subtotal: parseFloat((item.quantity * item.itemPrice).toFixed(2)),
  }));

  const order = await createOrderRepo({
    studentId: studentId as any,
    cafeId: cafeId as any,
    items: enrichedItems,
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    paymentMethod,
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
 * GET ORDER BY ID
 * =========================================================
 */

export const getOrderByIdService = async (
  orderId: string,
  requesterId: string,
  requesterRole: "student" | "cafe_owner" | "super_admin",
): Promise<IOrder> => {
  const order = await findOrderByIdRepo(orderId);

  if (
    requesterRole === "student" &&
    order.studentId.toString() !== requesterId
  ) {
    throw new ForbiddenError(
      "Tumhare paas yeh order dekhne ki permission nahi hai",
    );
  }

  if (
    requesterRole === "cafe_owner" &&
    order.cafeId.toString() !== requesterId
  ) {
    throw new ForbiddenError("Yeh order tumhare cafe ka nahi hai");
  }

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
 * GET ORDERS BY CAFE
 * =========================================================
 */

export const getCafeOrdersService = async (
  cafeId: string,
  status?: OrderStatus,
): Promise<IOrder[]> => {
  return await findOrdersByCafeRepo(cafeId, status);
};

/**
 * =========================================================
 * UPDATE ORDER STATUS  (Cafe action)
 * =========================================================
 */

export interface UpdateOrderStatusInput {
  orderId: string;
  newStatus: OrderStatus;
  cafeId: string;
  estimatedReadyTime?: Date;
}

export const updateOrderStatusService = async (
  input: UpdateOrderStatusInput,
): Promise<IOrder> => {
  const { orderId, newStatus, cafeId, estimatedReadyTime } = input;

  const order = await findOrderByIdRepo(orderId);

  if (order.cafeId.toString() !== cafeId) {
    throw new ForbiddenError(
      "Tumhare paas yeh order update karne ki permission nahi hai",
    );
  }

  if (newStatus === "accepted" && order.paymentStatus !== "paid") {
    throw new BadRequestError(
      "Payment complete nahi hai, order accept nahi ho sakta",
    );
  }

  validateTransition(order.status as OrderStatus, newStatus);

  const extraFields: Partial<IOrder> = {};
  const tsField = TIMESTAMP_FIELDS[newStatus];
  if (tsField) {
    (extraFields as any)[tsField] = new Date();
  }
  if (estimatedReadyTime) {
    extraFields.estimatedReadyTime = estimatedReadyTime;
  }

  const updatedOrder = await updateOrderStatusRepo(
    orderId,
    newStatus,
    extraFields,
  );

  logger.info("Order status updated", {
    orderId,
    oldStatus: order.status,
    newStatus,
    cafeId,
  });

  const studentId = order.studentId.toString();

  emitStatusUpdate(studentId, {
    orderId,
    status: newStatus,
    estimatedReadyTime: updatedOrder.estimatedReadyTime,
    message: STATUS_MESSAGES[newStatus],
  });

  if (newStatus === "ready") {
    emitOrderReady(studentId, {
      orderId,
      pickupCode: order.pickupCode,
    });
  }

  if (["rejected", "completed"].includes(newStatus)) {
    emitAdminOrderEvent("admin:order:statusChanged", {
      orderId,
      newStatus,
      cafeId,
      studentId,
    });
  }

  return updatedOrder;
};

/**
 * =========================================================
 * CANCEL ORDER
 * =========================================================
 */

export interface CancelOrderInput {
  orderId: string;
  cancelledBy: "student" | "cafe_owner" | "super_admin";
  reason: string;
  requesterId: string;
}

export const cancelOrderService = async (
  input: CancelOrderInput,
): Promise<IOrder> => {
  const { orderId, cancelledBy, reason, requesterId } = input;

  const order = await findOrderByIdRepo(orderId);

  if (cancelledBy === "student" && order.studentId.toString() !== requesterId) {
    throw new ForbiddenError("Tum sirf apna order cancel kar sakte ho");
  }

  if (cancelledBy === "cafe_owner" && order.cafeId.toString() !== requesterId) {
    throw new ForbiddenError("Tum sirf apne cafe ka order cancel kar sakte ho");
  }

  if (!CANCELLABLE_STATUSES.includes(order.status as OrderStatus)) {
    throw new BadRequestError(
      `'${order.status}' status ka order cancel nahi ho sakta. Sirf ${CANCELLABLE_STATUSES.join(", ")} cancel ho sakte hain`,
    );
  }

  if (!reason || reason.trim().length === 0) {
    throw new BadRequestError("Cancellation reason dena zaroori hai");
  }

  const cancelledOrder = await cancelOrderRepo(orderId, cancelledBy, reason);

  logger.info("Order cancelled", {
    orderId,
    cancelledBy,
    reason,
    previousStatus: order.status,
  });

  const studentId = order.studentId.toString();

  emitOrderCancelled(studentId, {
    orderId,
    reason,
    cancelledBy:
      cancelledBy === "cafe_owner"
        ? "cafe"
        : cancelledBy === "super_admin"
          ? "admin"
          : "student",
  });

  emitStatusUpdate(studentId, {
    orderId,
    status: "cancelled",
    message: STATUS_MESSAGES["cancelled"],
  });

  emitAdminOrderEvent("admin:order:cancelled", {
    orderId,
    cancelledBy,
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

export interface RateOrderInput {
  orderId: string;
  studentId: string;
  stars: number;
  review?: string;
}

export const rateOrderService = async (
  input: RateOrderInput,
): Promise<IOrder> => {
  const { orderId, studentId, stars, review = "" } = input;

  const order = await findOrderByIdRepo(orderId);

  if (order.studentId.toString() !== studentId) {
    throw new ForbiddenError("Tum sirf apna order rate kar sakte ho");
  }

  if (order.status !== "completed") {
    throw new BadRequestError("Sirf completed orders ko rate kar sakte ho");
  }

  if (order.rating?.stars) {
    throw new BadRequestError("Yeh order already rate ho chuka hai");
  }

  if (stars < 1 || stars > 5) {
    throw new BadRequestError("Stars 1 se 5 ke beech hona chahiye");
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
