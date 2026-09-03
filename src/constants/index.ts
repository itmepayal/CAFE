import { IOrder } from "../models/order";
import { OrderStatus } from "../modules/order/order.constant";

export { ORDER_AUTO_CANCEL_MINUTES } from "../modules/order/order.constant";

/** Single source of truth for owner order status transitions. */
export const ORDER_STATUS_TRANSITIONS: Record<
  IOrder["status"],
  IOrder["status"][]
> = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "ready", "cancelled"],
  rejected: [],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  out_for_delivery: ["completed", "cancelled"],
};

export const CANCELLABLE_STATUSES: OrderStatus[] = ["pending", "accepted"];

export const ALLOWED_UPDATE_FIELDS = [
  "name",
  "description",
  "price",
  "discountedPrice",
  "category",
  "image",
  "isAvailable",
  "preparationTime",
  "isVeg",
  "isPopular",
  "isRecommended",
  "tags",
  "stockQuantity",
  "displayOrder",
  "nutritionalInfo",
] as const;
