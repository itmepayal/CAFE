/**
 * Socket.IO event names for the Super Admin portal (Figma screens).
 */
export const ADMIN_SOCKET_EVENTS = {
  DASHBOARD_UPDATED: "admin:dashboard:updated",
  CAFE_REQUEST: "admin:cafe:request",
  CAFE_UPDATED: "admin:cafe:updated",
  PAYMENT_UPDATE: "admin:payment:update",
  USER_REGISTERED: "admin:user:registered",
  ORDER_NEW: "admin:order:new",
  ORDER_ACCEPTED: "admin:order:accepted",
  ORDER_REJECTED: "admin:order:rejected",
  ORDER_PREPARING: "admin:order:preparing",
  ORDER_READY: "admin:order:ready",
  ORDER_COMPLETED: "admin:order:completed",
  ORDER_CANCELLED: "admin:order:cancelled",
  ORDER_AUTO_CANCELLED: "admin:order:auto_cancelled",
  ORDER_LOCATION_STREAM: "admin:orderLocationStream",
  CONNECTED: "admin:connected",
} as const;

export type AdminSocketEvent =
  (typeof ADMIN_SOCKET_EVENTS)[keyof typeof ADMIN_SOCKET_EVENTS];
