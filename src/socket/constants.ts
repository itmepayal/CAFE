export const SOCKET_ROOMS = {
  ADMINS: "admins",
  student: (userId: string) => `student:${userId}`,
  cafe: (cafeId: string) => `cafe:${cafeId}`,
  order: (orderId: string) => `order:${orderId}`,
} as const;

export const SOCKET_PROTOCOL_VERSION = 1;

export const SOCKET_CONFIG = {
  PING_TIMEOUT_MS: 60_000,
  PING_INTERVAL_MS: 25_000,
  MAX_DISCONNECTION_DURATION_MS: 120_000,
  DASHBOARD_DEBOUNCE_MS: 300,
} as const;

export const ADMIN_REALTIME_REASONS = {
  STATS_CHANGED: "stats_changed",
  CAFE_REQUEST: "cafe_request",
  CAFE_UPDATED: "cafe_updated",
  PAYMENT_CHANGED: "payment_changed",
  PAYMENT_PENDING: "payment_pending",
  PAYMENT_PAID: "payment_paid",
  ORDER_REFUNDED: "order_refunded",
  USER_REGISTERED: "user_registered",
  ORDER: "order",
  INITIAL_SYNC: "initial_sync",
} as const;

export type AdminRealtimeReason =
  (typeof ADMIN_REALTIME_REASONS)[keyof typeof ADMIN_REALTIME_REASONS];
