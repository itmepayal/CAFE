import type { AdminSocketEvent } from "./admin.events";

export type AdminCafeAction =
  | "request_submitted"
  | "approved"
  | "rejected"
  | "blocked"
  | "unblocked"
  | "visibility_toggled"
  | "open_toggled";

export interface AdminCafeSocketPayload {
  cafeId: string;
  cafeName: string;
  ownerName?: string;
  status: string;
  isOpen: boolean;
  isVisible: boolean;
  isBlocked: boolean;
  statusLabel: "OPEN" | "CLOSED";
  action: AdminCafeAction;
}

export interface AdminPaymentSocketPayload {
  orderId: string;
  orderNumber: string;
  paymentId: string;
  userName: string;
  userEmail: string;
  cafeName: string;
  paymentMethod: string;
  amount: number;
  paymentStatus: string;
  createdAt?: Date;
}

export interface AdminUserRegisteredPayload {
  userId: string;
  name: string;
  email: string;
  role: string;
  provider: string;
}

export interface AdminDashboardStatsPayload {
  totalEarnings: number;
  totalCollection: number;
  activeOrders: number;
  totalOrders: number;
  totalUsers: number;
  activeCafes: number;
  openCafes: number;
  totalCafes: number;
  pendingCafeRequests: number;
  allUsersCount: number;
  allOrdersCount: number;
  todayOrders: number;
  orderStatusCounts: Array<{ _id: string; count: number }>;
}

export interface AdminPaymentSummaryPayload {
  totalCollection: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
}

export interface AdminConnectedPayload {
  userId: string;
  subscribed: true;
  rooms: string[];
  protocolVersion: number;
  message: string;
}

export interface SocketEnvelopeMeta {
  eventId: string;
  event: AdminSocketEvent;
  timestamp: string;
  version: number;
  reason?: string;
}

export interface SocketEnvelope<T> {
  meta: SocketEnvelopeMeta;
  data: T;
}

export interface AdminDashboardUpdatedData {
  stats: AdminDashboardStatsPayload;
}

export interface AdminPaymentUpdatedData {
  transaction: AdminPaymentSocketPayload | null;
  summary: AdminPaymentSummaryPayload;
}
