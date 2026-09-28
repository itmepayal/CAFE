import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../src/config/cashfree.config", () => ({
  createCashfreeRefund: vi.fn(),
}));

vi.mock("../src/modules/payment/payment.repository", () => ({
  findPaymentByOrderIdRepo: vi.fn(),
  createPaymentLedgerRepo: vi.fn(),
  claimPaymentRefundRepo: vi.fn(),
  markPaymentRefundedRepo: vi.fn(),
}));

vi.mock("../src/models/order", () => ({
  default: {
    findOneAndUpdate: vi.fn().mockResolvedValue({}),
  },
}));

import { createCashfreeRefund } from "../src/config/cashfree.config";
import {
  processOrderRefund,
  buildRefundIdempotencyKey,
} from "../src/modules/payment/refund.service";
import {
  findPaymentByOrderIdRepo,
  createPaymentLedgerRepo,
  claimPaymentRefundRepo,
  markPaymentRefundedRepo,
} from "../src/modules/payment/payment.repository";

describe("processOrderRefund", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses deterministic refund id without timestamps", () => {
    expect(buildRefundIdempotencyKey("GV12345678")).toBe("refund_GV12345678");
    expect(buildRefundIdempotencyKey("GV12345678")).not.toMatch(/\d{10,}/);
  });

  it("calls Cashfree for paid online orders with stable refund id", async () => {
    vi.mocked(createCashfreeRefund).mockResolvedValue({
      cf_refund_id: "41805719",
    });
    vi.mocked(findPaymentByOrderIdRepo).mockResolvedValue({
      _id: "pay1",
      status: "success",
      cashfreeRefundId: "",
    } as any);
    vi.mocked(claimPaymentRefundRepo).mockResolvedValue({
      _id: "pay1",
      status: "success",
      cashfreeRefundId: "refund_GV12345678",
    } as any);
    vi.mocked(markPaymentRefundedRepo).mockResolvedValue({} as any);

    const order = {
      _id: "order1",
      orderNumber: "GV12345678",
      paymentStatus: "paid",
      paymentMethod: "upi",
      totalAmount: 250,
      studentId: "user1",
    } as any;

    const result = await processOrderRefund(order, "Student cancelled");

    expect(createCashfreeRefund).toHaveBeenCalledWith(
      expect.objectContaining({
        refundId: "refund_GV12345678",
        orderId: "GV12345678",
      }),
    );
    expect(result.refunded).toBe(true);
  });

  it("skips Cashfree for unpaid orders", async () => {
    const order = {
      paymentStatus: "pending",
      paymentMethod: "upi",
      totalAmount: 100,
    } as any;

    const result = await processOrderRefund(order, "test");

    expect(createCashfreeRefund).not.toHaveBeenCalled();
    expect(result.refunded).toBe(false);
  });

  it("returns alreadyRefunded when order is refunded", async () => {
    const order = {
      orderNumber: "GV1",
      paymentStatus: "refunded",
      paymentMethod: "upi",
    } as any;

    const result = await processOrderRefund(order, "retry");

    expect(createCashfreeRefund).not.toHaveBeenCalled();
    expect(result.alreadyRefunded).toBe(true);
  });

  it("marks cash orders as local refund only", async () => {
    const order = {
      _id: "o1",
      paymentStatus: "paid",
      paymentMethod: "cash",
      totalAmount: 100,
    } as any;

    const result = await processOrderRefund(order, "test");

    expect(createCashfreeRefund).not.toHaveBeenCalled();
    expect(result.localOnly).toBe(true);
  });
});
