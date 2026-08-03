export const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

export const CASHFREE_API_VERSION = "2023-08-01";

export const PAYMENT_SESSION_EXPIRY_MINUTES = 20;

export const CASHFREE_WEBHOOK_EVENTS = {
  PAYMENT_SUCCESS: "PAYMENT_SUCCESS_WEBHOOK",
  PAYMENT_FAILED: "PAYMENT_FAILED_WEBHOOK",
  PAYMENT_USER_DROPPED: "PAYMENT_USER_DROPPED_WEBHOOK",
  REFUND_STATUS: "REFUND_STATUS_WEBHOOK",
} as const;
