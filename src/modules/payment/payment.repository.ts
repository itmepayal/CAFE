import Payment, { IPayment, PaymentStatus } from "../../models/payment";
import logger from "../../config/logger.config";
import { InternalServerError } from "../../utils/errors/app.error";

export const createPaymentLedgerRepo = async (data: {
  orderId: string;
  userId: string;
  amount: number;
  currency?: string;
  cashfreeOrderId?: string;
  paymentSessionId?: string;
  status?: PaymentStatus;
}): Promise<IPayment> => {
  try {
    return await Payment.create({
      orderId: data.orderId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency ?? "INR",
      provider: "cashfree",
      cashfreeOrderId: data.cashfreeOrderId ?? "",
      paymentSessionId: data.paymentSessionId ?? "",
      status: data.status ?? "pending",
    });
  } catch (error) {
    logger.error("Failed to create payment ledger entry", {
      orderId: data.orderId,
      error,
    });
    throw new InternalServerError("Failed to create payment record");
  }
};

export const findPaymentByOrderIdRepo = async (
  orderId: string,
): Promise<IPayment | null> => {
  return Payment.findOne({ orderId }).sort({ createdAt: -1 });
};

export const findPaymentByCashfreeOrderIdRepo = async (
  cashfreeOrderId: string,
): Promise<IPayment | null> => {
  if (!cashfreeOrderId) return null;
  return Payment.findOne({ cashfreeOrderId });
};

export const findPaymentByWebhookEventIdRepo = async (
  webhookEventId: string,
): Promise<IPayment | null> => {
  if (!webhookEventId) return null;
  return Payment.findOne({ webhookEventId });
};

export const claimWebhookEventRepo = async (
  paymentId: string,
  webhookEventId: string,
): Promise<IPayment | null> => {
  try {
    return await Payment.findOneAndUpdate(
      {
        _id: paymentId,
        $or: [
          { webhookEventId: "" },
          { webhookEventId: { $exists: false } },
          { webhookEventId },
        ],
      },
      {
        $set: {
          webhookEventId,
          isWebhookVerified: true,
          lastWebhookAt: new Date(),
        },
        $inc: { webhookAttempts: 1 },
      },
      { new: true },
    );
  } catch (error: unknown) {
    // Duplicate webhookEventId unique index → already processed elsewhere
    const code = (error as { code?: number })?.code;
    if (code === 11000) {
      return null;
    }
    throw error;
  }
};

export const markPaymentSuccessRepo = async (
  paymentId: string,
  data: {
    cashfreePaymentId?: string;
    paymentMethod?: string;
    gatewayResponse?: Record<string, unknown>;
  },
): Promise<IPayment | null> => {
  return Payment.findOneAndUpdate(
    {
      _id: paymentId,
      status: { $in: ["pending", "processing", "failed"] },
    },
    {
      $set: {
        status: "success",
        paidAt: new Date(),
        ...(data.cashfreePaymentId
          ? { cashfreePaymentId: data.cashfreePaymentId }
          : {}),
        ...(data.paymentMethod ? { paymentMethod: data.paymentMethod } : {}),
        ...(data.gatewayResponse
          ? { gatewayResponse: data.gatewayResponse }
          : {}),
      },
    },
    { new: true },
  );
};

export const markPaymentFailedRepo = async (
  paymentId: string,
  data: {
    failureCode?: string;
    failureReason?: string;
    gatewayResponse?: Record<string, unknown>;
  },
): Promise<IPayment | null> => {
  return Payment.findOneAndUpdate(
    {
      _id: paymentId,
      status: { $in: ["pending", "processing"] },
    },
    {
      $set: {
        status: "failed",
        failureCode: data.failureCode ?? "",
        failureReason: data.failureReason ?? "",
        ...(data.gatewayResponse
          ? { gatewayResponse: data.gatewayResponse }
          : {}),
      },
    },
    { new: true },
  );
};

export const markPaymentCancelledRepo = async (
  paymentId: string,
  reason?: string,
): Promise<IPayment | null> => {
  return Payment.findOneAndUpdate(
    {
      _id: paymentId,
      status: { $in: ["pending", "processing"] },
    },
    {
      $set: {
        status: "cancelled",
        failureReason: reason ?? "Payment cancelled / user dropped",
      },
    },
    { new: true },
  );
};

/**
 * Atomically claim a refund attempt with a deterministic refund ID.
 * Returns null if already refunded or another claim is in progress with a different id.
 */
export const claimPaymentRefundRepo = async (
  orderId: string,
  refundId: string,
  reason: string,
  refundAmount: number,
): Promise<IPayment | null> => {
  return Payment.findOneAndUpdate(
    {
      orderId,
      status: "success",
      $or: [
        { cashfreeRefundId: { $exists: false } },
        { cashfreeRefundId: null },
        { cashfreeRefundId: "" },
        { cashfreeRefundId: refundId },
      ],
    },
    {
      $set: {
        cashfreeRefundId: refundId,
        refundReason: reason,
        refundAmount,
      },
    },
    { new: true },
  );
};

export const markPaymentRefundedRepo = async (
  paymentId: string,
  data: {
    cashfreeRefundId?: string;
    refundAmount: number;
    gatewayResponse?: Record<string, unknown>;
  },
): Promise<IPayment | null> => {
  return Payment.findByIdAndUpdate(
    paymentId,
    {
      $set: {
        status: "refunded",
        refundedAt: new Date(),
        refundAmount: data.refundAmount,
        ...(data.cashfreeRefundId
          ? { cashfreeRefundId: data.cashfreeRefundId }
          : {}),
        ...(data.gatewayResponse
          ? { gatewayResponse: data.gatewayResponse }
          : {}),
      },
    },
    { new: true },
  );
};

export const updatePaymentCashfreeIdsRepo = async (
  orderId: string,
  data: { cashfreeOrderId?: string; paymentSessionId?: string },
): Promise<IPayment | null> => {
  return Payment.findOneAndUpdate(
    { orderId },
    {
      $set: {
        ...(data.cashfreeOrderId
          ? { cashfreeOrderId: data.cashfreeOrderId }
          : {}),
        ...(data.paymentSessionId
          ? { paymentSessionId: data.paymentSessionId }
          : {}),
      },
    },
    { new: true, sort: { createdAt: -1 } },
  );
};
