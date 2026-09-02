import type { OwnerSocketEvent } from "./owner.events";

export interface OwnerConnectedPayload {
  userId: string;
  cafeId: string;
  subscribed: true;
  rooms: string[];
  protocolVersion: number;
  message: string;
}

export interface OwnerDashboardStatsPayload {
  activeOrders: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
  totalRevenue: number;
  completedToday: number;
  isOpen: boolean;
  cafeName: string;
}

export interface OwnerDashboardUpdatedData {
  stats: OwnerDashboardStatsPayload;
}

export interface SocketEnvelopeMeta {
  eventId: string;
  event: OwnerSocketEvent;
  timestamp: string;
  version: number;
  reason?: string;
}

export interface SocketEnvelope<T> {
  meta: SocketEnvelopeMeta;
  data: T;
}
