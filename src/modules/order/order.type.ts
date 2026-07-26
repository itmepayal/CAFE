import { IDeliveryAddress } from "../../models/order";

export interface CancelOrderInput {
  orderId: string;
  studentId: string;
  reason: string;
}

export interface RateOrderInput {
  orderId: string;
  studentId: string;
  stars: number;
  review?: string;
}

export const PAYMENT_METHODS = ["upi", "card", "wallet", "cash"] as const;

export const ORDER_TYPES = ["pickup", "delivery"] as const;

export interface CreateOrderItemInput {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
}

export interface CreateOrderInput {
  studentId: string;
  cafeId: string;
  items: CreateOrderItemInput[];
  paymentMethod: string;
  notes?: string;
  taxRate?: number;
  discountAmount?: number;

  orderType?: (typeof ORDER_TYPES)[number];
  deliveryAddress?: IDeliveryAddress;
}

export interface UpdateDeliveryStatusInput {
  orderId: string;
  cafeId: string;
  deliveryStatus:
    | "not_assigned"
    | "assigned"
    | "out_for_delivery"
    | "delivered";
  deliveryPersonId?: string;
}
