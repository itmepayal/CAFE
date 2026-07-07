import { IOrder } from "../models/order";
import { OrderStatus } from "../socket/order";

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
};

export const STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending: "Order place ho gaya, cafe ka wait karo ⏳",
  accepted: "Cafe ne tumhara order accept kar liya! 🎉",
  rejected: "Cafe ne order reject kar diya.",
  preparing: "Tumhara khana ban raha hai... 👨‍🍳",
  ready: "Order ready hai! Pickup karo 🔔",
  completed: "Order complete! Enjoy your meal 😊",
  cancelled: "Tumhara order cancel ho gaya.",
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
