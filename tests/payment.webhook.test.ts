import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../src/models/webhook-event", () => ({
  default: {
    create: vi.fn(),
  },
}));

vi.mock("../src/models/order", () => ({
  default: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock("../src/modules/payment/payment.repository", () => ({
  findPaymentByOrderIdRepo: vi.fn(),
  findPaymentByCashfreeOrderIdRepo: vi.fn(),
  createPaymentLedgerRepo: vi.fn(),
  markPaymentSuccessRepo: vi.fn(),
  markPaymentFailedRepo: vi.fn(),
  markPaymentCancelledRepo: vi.fn(),
  markPaymentRefundedRepo: vi.fn(),
  updatePaymentCashfreeIdsRepo: vi.fn(),
}));

vi.mock("../src/modules/payment/refund.service", () => ({
  processOrderRefund: vi.fn().mockResolvedValue({ refunded: true }),
}));

vi.mock("../src/socket/admin", () => ({
  notifyAdminPaymentUpdate: vi.fn(),
  toAdminPaymentPayload: vi.fn((o) => o),
}));

vi.mock("../src/socket/order", () => ({
  emitNewOrderToCafe: vi.fn(),
  emitStatusUpdate: vi.fn(),
  emitAdminOrderEvent: vi.fn(),
}));

import WebhookEvent from "../src/models/webhook-event";
import Order from "../src/models/order";
import {
  buildWebhookEventKey,
  claimWebhookEvent,
  handlePaymentSuccessWebhook,
  isWebhookTimestampFresh,
  processCashfreeWebhookEvent,
} from "../src/modules/payment/webhook.service";
import { processOrderRefund } from "../src/modules/payment/refund.service";
import {
  createPaymentLedgerRepo,
  findPaymentByOrderIdRepo,
  markPaymentSuccessRepo,
} from "../src/modules/payment/payment.repository";
import { CASHFREE_WEBHOOK_EVENTS } from "../src/modules/payment/payment.constant";

describe("webhook helpers", () => {
  it("builds stable event keys from payment id", () => {
    const key = buildWebhookEventKey({
      type: CASHFREE_WEBHOOK_EVENTS.PAYMENT_SUCCESS,
      data: {
        order: { order_id: "GV1", order_amount: 100, order_currency: "INR" },
        payment: {
          cf_payment_id: "pay_1",
          payment_status: "SUCCESS",
          payment_amount: 100,
          payment_method: {},
          payment_time: "t",
        },
      },
      event_time: "t",
    });
    expect(key).toBe(`${CASHFREE_WEBHOOK_EVENTS.PAYMENT_SUCCESS}:pay_1`);
  });

  it("rejects stale webhook timestamps", () => {
    const old = String(Math.floor(Date.now() / 1000) - 600);
    expect(isWebhookTimestampFresh(old)).toBe(false);
    const now = String(Math.floor(Date.now() / 1000));
    expect(isWebhookTimestampFresh(now)).toBe(true);
  });
});

describe("claimWebhookEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns false on duplicate key", async () => {
    vi.mocked(WebhookEvent.create).mockRejectedValue({ code: 11000 });
    const ok = await claimWebhookEvent("k1", "PAYMENT_SUCCESS_WEBHOOK", "GV1");
    expect(ok).toBe(false);
  });

  it("returns true on first claim", async () => {
    vi.mocked(WebhookEvent.create).mockResolvedValue({} as any);
    const ok = await claimWebhookEvent("k2", "PAYMENT_SUCCESS_WEBHOOK", "GV1");
    expect(ok).toBe(true);
  });
});

describe("late payment after cancellation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("initiates refund when order already cancelled", async () => {
    const order = {
      _id: "o1",
      orderNumber: "GV99",
      status: "cancelled",
      paymentStatus: "pending",
      totalAmount: 150,
      studentId: "s1",
      cafeId: "c1",
      paymentId: "cf1",
    };

    vi.mocked(Order.findOne).mockReturnValue({
      populate: vi.fn().mockReturnValue({
        populate: vi.fn().mockResolvedValue(order),
      }),
    } as any);

    vi.mocked(findPaymentByOrderIdRepo).mockResolvedValue({
      _id: "p1",
      status: "pending",
    } as any);
    vi.mocked(markPaymentSuccessRepo).mockResolvedValue({} as any);
    vi.mocked(Order.findByIdAndUpdate).mockResolvedValue({} as any);

    await handlePaymentSuccessWebhook({
      type: CASHFREE_WEBHOOK_EVENTS.PAYMENT_SUCCESS,
      data: {
        order: {
          order_id: "GV99",
          order_amount: 150,
          order_currency: "INR",
        },
        payment: {
          cf_payment_id: "cfpay1",
          payment_status: "SUCCESS",
          payment_amount: 150,
          payment_method: { upi: {} },
          payment_time: new Date().toISOString(),
        },
      },
      event_time: new Date().toISOString(),
    });

    expect(processOrderRefund).toHaveBeenCalled();
  });
});

describe("processCashfreeWebhookEvent idempotency", () => {
  beforeEach(() => vi.clearAllMocks());

  it("skips duplicate events", async () => {
    vi.mocked(WebhookEvent.create).mockRejectedValue({ code: 11000 });

    const result = await processCashfreeWebhookEvent({
      type: CASHFREE_WEBHOOK_EVENTS.PAYMENT_SUCCESS,
      data: {
        order: { order_id: "GV1", order_amount: 10, order_currency: "INR" },
        payment: {
          cf_payment_id: "dup",
          payment_status: "SUCCESS",
          payment_amount: 10,
          payment_method: {},
          payment_time: "t",
        },
      },
      event_time: "t",
    });

    expect(result.duplicate).toBe(true);
  });
});
