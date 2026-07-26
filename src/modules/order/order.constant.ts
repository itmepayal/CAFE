// =========================================================
// PAYMENT

import { IOrder } from "../../models/order";

// =========================================================
export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["upi", "card", "wallet", "cash"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// =========================================================
// ORDER
// =========================================================
export const ORDER_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "accepted"];

export const STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending: "Your order has been placed and is awaiting confirmation.",
  accepted: "Your order has been accepted by the cafe.",
  rejected: "Your order was rejected by the cafe.",
  preparing: "Your order is being prepared.",
  ready: "Your order is ready.",
  out_for_delivery: "Your order is out for delivery.",
  completed: "Your order has been completed.",
  cancelled: "Your order has been cancelled.",
};

// =========================================================
// ORDER TYPE
// =========================================================
export const ORDER_TYPES = ["pickup", "delivery"] as const;

export type OrderType = (typeof ORDER_TYPES)[number];

// =========================================================
// DELIVERY
// =========================================================
export const DELIVERY_STATUSES = [
  "not_assigned",
  "assigned",
  "out_for_delivery",
  "delivered",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

// =========================================================
// CANCELLED BY
// =========================================================
export const CANCELLED_BY = ["student", "cafe_owner", "super_admin"] as const;

export type CancelledBy = (typeof CANCELLED_BY)[number];

export const ORDER_AUTO_CANCEL_MINUTES = 10;
export const STUDENT_CANCEL_WINDOW_MINUTES = 10;

export const STATUS_TIMESTAMP_FIELD: Partial<
  Record<IOrder["status"], keyof IOrder>
> = {
  accepted: "acceptedAt",
  preparing: "preparingAt",
  ready: "readyAt",
  completed: "completedAt",
  cancelled: "cancelledAt",
  rejected: "cancelledAt",
};
