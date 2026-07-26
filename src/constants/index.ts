import { IOrder } from "../models/order";
import { OrderStatus } from "../modules/order/order.constant";

export const ORDER_STATUS_TRANSITIONS: Record<
  IOrder["status"],
  IOrder["status"][]
> = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "cancelled"],
  rejected: [],
  preparing: ["ready", "cancelled"],
  ready: ["completed"],
  completed: [],
  cancelled: [],
  out_for_delivery: [],
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
  "ingredients",
] as const;

export const ORDER_AUTO_CANCEL_MINUTES = 10 / 60;
