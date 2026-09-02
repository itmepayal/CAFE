export const OWNER_SOCKET_EVENTS = {
  CONNECTED: "owner:connected",
  DASHBOARD_UPDATED: "owner:dashboard:updated",
  ORDER_NEW: "owner:order:new",
  ORDER_UPDATED: "owner:order:updated",
  ORDER_CANCELLED: "owner:order:cancelled",
} as const;

export type OwnerSocketEvent =
  (typeof OWNER_SOCKET_EVENTS)[keyof typeof OWNER_SOCKET_EVENTS];

export const OWNER_REALTIME_REASONS = {
  INITIAL_SYNC: "initial_sync",
  ORDER_NEW: "order_new",
  ORDER_UPDATED: "order_updated",
  ORDER_CANCELLED: "order_cancelled",
  DASHBOARD: "dashboard",
} as const;

export type OwnerRealtimeReason =
  (typeof OWNER_REALTIME_REASONS)[keyof typeof OWNER_REALTIME_REASONS];
