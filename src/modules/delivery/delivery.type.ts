import { DeliveryStatus } from "../order/order.constant";

export interface GetAvailableDeliveryOrdersQuery {
  cafeId?: string;
  hostelName?: string;
  page?: number;
  limit?: number;
}

export interface GetMyDeliveriesQuery {
  active?: boolean;
  history?: boolean;
  deliveryStatus?: DeliveryStatus;
  page?: number;
  limit?: number;
}

export interface UpdateDeliveryStatusInput {
  orderId: string;
  deliveryPersonId: string;
  status: "out_for_delivery" | "delivered";
}

export interface DeliveryPaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
