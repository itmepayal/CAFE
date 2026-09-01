import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../src/config/cashfree.config", () => ({
  createCashfreeRefund: vi.fn(),
}));

import { createCashfreeRefund } from "../src/config/cashfree.config";
import { processOrderRefund } from "../src/modules/payment/refund.service";

describe("processOrderRefund", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("calls Cashfree for paid online orders", async () => {
    vi.mocked(createCashfreeRefund).mockResolvedValue({
      cf_refund_id: "41805719",
    });

    const order = {
      _id: "order1",
      orderNumber: "GV12345678",
      paymentStatus: "paid",
      paymentMethod: "upi",
      totalAmount: 250,
    } as any;

    const result = await processOrderRefund(order, "Student cancelled");

    expect(createCashfreeRefund).toHaveBeenCalledOnce();
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

  it("marks cash orders as local refund only", async () => {
    const order = {
      paymentStatus: "paid",
      paymentMethod: "cash",
      totalAmount: 100,
    } as any;

    const result = await processOrderRefund(order, "test");

    expect(createCashfreeRefund).not.toHaveBeenCalled();
    expect(result.localOnly).toBe(true);
  });
});
