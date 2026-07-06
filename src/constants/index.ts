import { IOrder } from "../models/order";

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
