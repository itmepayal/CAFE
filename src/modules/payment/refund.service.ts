import { createCashfreeRefund } from "../../config/cashfree.config";
import { IOrder } from "../../models/order";
import Order from "../../models/order";
import logger from "../../config/logger.config";
import {
  BadRequestError,
  InternalServerError,
} from "../../utils/errors/app.error";
import {
  claimPaymentRefundRepo,
  findPaymentByOrderIdRepo,
  markPaymentRefundedRepo,
  createPaymentLedgerRepo,
} from "./payment.repository";

export interface RefundResult {
  refunded: boolean;
  alreadyRefunded?: boolean;
  refundId?: string;
  localOnly?: boolean;
  inProgress?: boolean;
}

/** Deterministic provider/idempotency key — never include timestamps. */
export const buildRefundIdempotencyKey = (orderNumber: string): string =>
  `refund_${orderNumber}`;

/**
 * Provider-backed refund with idempotent retries.
 *
 * Order paymentStatus transitions:
 *   paid → refund_pending → refunded
 * Never invents "refunded" without a provider (or local cash) outcome.
 */
export const processOrderRefund = async (
  order: IOrder,
  reason: string,
): Promise<RefundResult> => {
  if (order.paymentStatus === "refunded") {
    return {
      refunded: true,
      alreadyRefunded: true,
      refundId: buildRefundIdempotencyKey(order.orderNumber),
    };
  }

  if (
    order.paymentStatus !== "paid" &&
    order.paymentStatus !== "refund_pending"
  ) {
    return { refunded: false };
  }

  if (order.paymentMethod === "cash") {
    await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $in: ["paid", "refund_pending"] } },
      { $set: { paymentStatus: "refunded" } },
    );

    logger.info("Cash order marked for local refund only", {
      orderId: order._id,
      orderNumber: order.orderNumber,
    });

    return { refunded: true, localOnly: true };
  }

  if (!order.orderNumber) {
    throw new BadRequestError("Order number missing; cannot process refund.");
  }

  const refundId = buildRefundIdempotencyKey(order.orderNumber);
  const orderIdStr = order._id.toString();

  // Atomically claim refund on the order (paid → refund_pending)
  const claimedOrder = await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: { $in: ["paid", "refund_pending"] },
    },
    { $set: { paymentStatus: "refund_pending" } },
    { new: true },
  );

  if (!claimedOrder) {
    const fresh = await Order.findById(order._id);
    if (fresh?.paymentStatus === "refunded") {
      return {
        refunded: true,
        alreadyRefunded: true,
        refundId,
      };
    }
    return { refunded: false };
  }

  let payment = await findPaymentByOrderIdRepo(orderIdStr);

  if (!payment) {
    payment = await createPaymentLedgerRepo({
      orderId: orderIdStr,
      userId: order.studentId.toString(),
      amount: order.totalAmount,
      cashfreeOrderId: order.paymentId || order.orderNumber,
      status: "success",
    });
  }

  if (payment.status === "refunded") {
    await Order.findOneAndUpdate(
      { _id: order._id },
      { $set: { paymentStatus: "refunded" } },
    );
    return {
      refunded: true,
      alreadyRefunded: true,
      refundId: payment.cashfreeRefundId || refundId,
    };
  }

  const claimedPayment = await claimPaymentRefundRepo(
    orderIdStr,
    refundId,
    reason.slice(0, 200),
    order.totalAmount,
  );

  if (
    !claimedPayment &&
    (await findPaymentByOrderIdRepo(orderIdStr))?.cashfreeRefundId !== refundId
  ) {
    const latest = await findPaymentByOrderIdRepo(orderIdStr);
    if (latest?.status === "refunded") {
      await Order.findOneAndUpdate(
        { _id: order._id },
        { $set: { paymentStatus: "refunded" } },
      );
      return {
        refunded: true,
        alreadyRefunded: true,
        refundId: latest.cashfreeRefundId || refundId,
      };
    }
  }

  try {
    const cfRefund = await createCashfreeRefund({
      orderId: order.orderNumber,
      refundAmount: order.totalAmount,
      refundId,
      refundNote: reason.slice(0, 200),
    });

    const providerRefundId = cfRefund?.cf_refund_id ?? refundId;
    const paymentDocId = (claimedPayment ?? payment)._id.toString();

    await markPaymentRefundedRepo(paymentDocId, {
      cashfreeRefundId: providerRefundId,
      refundAmount: order.totalAmount,
      gatewayResponse: {
        refund: cfRefund,
        reason,
      },
    });

    await Order.findOneAndUpdate(
      {
        _id: order._id,
        paymentStatus: { $in: ["paid", "refund_pending"] },
      },
      { $set: { paymentStatus: "refunded" } },
    );

    logger.info("Cashfree refund initiated", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      refundId,
      cfRefundId: providerRefundId,
    });

    return {
      refunded: true,
      refundId: providerRefundId,
    };
  } catch (error) {
    // Release claim so a later retry can proceed
    await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: "refund_pending" },
      { $set: { paymentStatus: "paid" } },
    );

    logger.error("Cashfree refund failed", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      refundId,
      error,
    });

    throw new InternalServerError(
      "Refund could not be processed. Please contact support.",
    );
  }
};
