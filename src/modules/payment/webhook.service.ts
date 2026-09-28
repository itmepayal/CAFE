import crypto from "crypto";
import WebhookEvent from "../../models/webhook-event";
import Order from "../../models/order";
import logger from "../../config/logger.config";
import { CASHFREE_WEBHOOK_EVENTS } from "./payment.constant";
import { CashfreeWebhookPayload } from "./payment.type";
import {
  findPaymentByOrderIdRepo,
  findPaymentByCashfreeOrderIdRepo,
  createPaymentLedgerRepo,
  markPaymentSuccessRepo,
  markPaymentFailedRepo,
  markPaymentCancelledRepo,
  markPaymentRefundedRepo,
  updatePaymentCashfreeIdsRepo,
} from "./payment.repository";
import { processOrderRefund } from "./refund.service";
import {
  notifyAdminPaymentUpdate,
  toAdminPaymentPayload,
} from "../../socket/admin";
import {
  emitNewOrderToCafe,
  emitStatusUpdate,
  emitAdminOrderEvent,
} from "../../socket/order";

const WEBHOOK_MAX_SKEW_MS = 5 * 60 * 1000;

export const buildWebhookEventKey = (
  event: CashfreeWebhookPayload,
): string => {
  const orderId = event.data?.order?.order_id ?? "unknown";
  const paymentId = event.data?.payment?.cf_payment_id ?? "";
  const type = event.type ?? "unknown";
  const eventTime = event.event_time ?? "";

  // Prefer provider payment id + type; fall back to hash of type+order+time
  if (paymentId) {
    return `${type}:${paymentId}`;
  }

  const digest = crypto
    .createHash("sha256")
    .update(`${type}:${orderId}:${eventTime}`)
    .digest("hex")
    .slice(0, 32);

  return `${type}:${orderId}:${digest}`;
};

export const isWebhookTimestampFresh = (timestamp: string): boolean => {
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return false;
  }

  // Cashfree sends unix seconds or ms depending on version
  const ms = ts < 1e12 ? ts * 1000 : ts;
  return Math.abs(Date.now() - ms) <= WEBHOOK_MAX_SKEW_MS;
};

/**
 * Try to insert event key. Returns false if already processed (duplicate).
 */
export const claimWebhookEvent = async (
  eventKey: string,
  eventType: string,
  orderNumber: string,
): Promise<boolean> => {
  try {
    await WebhookEvent.create({
      eventKey,
      eventType,
      orderNumber,
      processedAt: new Date(),
    });
    return true;
  } catch (error: unknown) {
    const code = (error as { code?: number })?.code;
    if (code === 11000) {
      return false;
    }
    throw error;
  }
};

const resolvePaymentMethod = (
  method: Record<string, unknown> | undefined,
): string => {
  if (!method || typeof method !== "object") return "upi";
  if ("upi" in method) return "upi";
  if ("card" in method) return "card";
  if ("netbanking" in method) return "netbanking";
  if ("app" in method || "wallet" in method) return "wallet";
  return "upi";
};

const ensurePaymentLedger = async (order: {
  _id: { toString(): string };
  studentId: { toString(): string };
  totalAmount: number;
  paymentId?: string;
  orderNumber: string;
}) => {
  const orderId = order._id.toString();
  let payment = await findPaymentByOrderIdRepo(orderId);

  if (!payment && order.paymentId) {
    payment = await findPaymentByCashfreeOrderIdRepo(order.paymentId);
  }

  if (!payment) {
    payment = await createPaymentLedgerRepo({
      orderId,
      userId: order.studentId.toString(),
      amount: order.totalAmount,
      cashfreeOrderId: order.paymentId || order.orderNumber,
      status: "pending",
    });
  }

  return payment;
};

const notifyPaidOrderSideEffects = (order: InstanceType<typeof Order>) => {
  const studentIdStr =
    (order.studentId as { _id?: { toString(): string } })?._id?.toString() ??
    order.studentId.toString();

  emitStatusUpdate(studentIdStr, {
    orderId: order._id.toString(),
    status: order.status,
    message: "Payment received! Your order has been confirmed.",
  });

  emitNewOrderToCafe(order.cafeId.toString(), {
    orderId: order._id,
    orderNumber: order.orderNumber,
    studentId: order.studentId,
    studentName: (order.studentId as { name?: string })?.name,
    studentContact: (order.studentId as { phone?: string })?.phone,
    items: order.items,
    totalAmount: order.totalAmount,
    notes: order.notes,
    orderType: order.orderType,
    pickupCode: order.orderType === "pickup" ? order.pickupCode : undefined,
    deliveryAddress:
      order.orderType === "delivery" ? order.deliveryAddress : undefined,
    createdAt: order.createdAt,
  });

  emitAdminOrderEvent("admin:order:new", {
    orderId: order._id,
    orderNumber: order.orderNumber,
    cafeId: order.cafeId.toString(),
    studentId: studentIdStr,
    orderType: order.orderType,
    totalAmount: order.totalAmount,
  });

  notifyAdminPaymentUpdate(toAdminPaymentPayload(order), "payment_paid");
};

/**
 * Atomic mark-paid for active orders. Returns updated order or null if not eligible.
 */
export const atomicMarkOrderPaid = async (
  orderNumber: string,
  cashfreePaymentId?: string,
) => {
  return Order.findOneAndUpdate(
    {
      orderNumber,
      paymentStatus: "pending",
      status: { $nin: ["cancelled", "rejected"] },
    },
    {
      $set: {
        paymentStatus: "paid",
        status: "accepted",
        ...(cashfreePaymentId ? { paymentId: cashfreePaymentId } : {}),
        acceptedAt: new Date(),
      },
      $push: {
        statusHistory: {
          status: "accepted",
          changedAt: new Date(),
        },
      },
    },
    { new: true },
  )
    .populate("studentId", "name email phone")
    .populate("cafeId");
};

export const handlePaymentSuccessWebhook = async (
  event: CashfreeWebhookPayload,
): Promise<void> => {
  const orderNumber = event.data?.order?.order_id;
  if (!orderNumber) {
    logger.warn("PAYMENT_SUCCESS webhook missing order_id");
    return;
  }

  const cfPaymentId = event.data?.payment?.cf_payment_id ?? "";
  const paymentAmount = event.data?.payment?.payment_amount;
  const orderAmount = event.data?.order?.order_amount;

  const order = await Order.findOne({ orderNumber })
    .populate("studentId", "name email phone")
    .populate("cafeId");

  if (!order) {
    logger.warn("PAYMENT_SUCCESS for unknown order", { orderNumber });
    return;
  }

  if (
    cfPaymentId &&
    typeof paymentAmount === "number" &&
    paymentAmount > 0 &&
    Math.abs(paymentAmount - order.totalAmount) > 0.01
  ) {
    logger.error("Payment amount mismatch — refusing to mark paid", {
      orderNumber,
      expected: order.totalAmount,
      paymentAmount,
      orderAmount,
    });
    return;
  }

  const payment = await ensurePaymentLedger(order);

  await markPaymentSuccessRepo(payment._id.toString(), {
    cashfreePaymentId: cfPaymentId,
    paymentMethod: resolvePaymentMethod(
      event.data?.payment?.payment_method as Record<string, unknown>,
    ),
    gatewayResponse: event.data as unknown as Record<string, unknown>,
  });

  // Late payment after cancel/reject → refund immediately
  if (["cancelled", "rejected"].includes(order.status)) {
    logger.warn("Late payment on cancelled/rejected order — initiating refund", {
      orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
    });

    // Ensure order reflects paid so refund path can run
    if (order.paymentStatus !== "paid" && order.paymentStatus !== "refunded") {
      await Order.findByIdAndUpdate(order._id, {
        $set: { paymentStatus: "paid" },
      });
      order.paymentStatus = "paid";
    }

    if (order.paymentStatus !== "refunded") {
      await processOrderRefund(
        order,
        `Automatic refund: payment received after order was ${order.status}`,
      );
    }

    notifyAdminPaymentUpdate(
      toAdminPaymentPayload(order),
      "order_refunded",
    );
    return;
  }

  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
    logger.info("PAYMENT_SUCCESS idempotent no-op", {
      orderNumber,
      paymentStatus: order.paymentStatus,
    });
    return;
  }

  const updated = await atomicMarkOrderPaid(orderNumber, cfPaymentId || undefined);

  if (!updated) {
    // Race: status changed concurrently — re-check
    const fresh = await Order.findOne({ orderNumber });
    if (fresh && ["cancelled", "rejected"].includes(fresh.status)) {
      if (fresh.paymentStatus !== "refunded") {
        if (fresh.paymentStatus !== "paid") {
          await Order.findByIdAndUpdate(fresh._id, {
            $set: { paymentStatus: "paid" },
          });
          fresh.paymentStatus = "paid";
        }
        await processOrderRefund(
          fresh,
          `Automatic refund: payment race after ${fresh.status}`,
        );
      }
    }
    return;
  }

  notifyPaidOrderSideEffects(updated);
};

export const handlePaymentFailedWebhook = async (
  event: CashfreeWebhookPayload,
): Promise<void> => {
  const orderNumber = event.data?.order?.order_id;
  if (!orderNumber) return;

  const order = await Order.findOne({ orderNumber });
  if (!order) return;

  const payment = await ensurePaymentLedger(order);

  await markPaymentFailedRepo(payment._id.toString(), {
    failureReason: event.data?.payment?.failure_reason ?? "Payment failed",
    gatewayResponse: event.data as unknown as Record<string, unknown>,
  });

  await Order.findOneAndUpdate(
    {
      _id: order._id,
      paymentStatus: "pending",
      status: { $nin: ["cancelled", "rejected", "completed"] },
    },
    { $set: { paymentStatus: "failed" } },
  );

  notifyAdminPaymentUpdate(toAdminPaymentPayload(order), "payment_failed");
};

export const handlePaymentUserDroppedWebhook = async (
  event: CashfreeWebhookPayload,
): Promise<void> => {
  const orderNumber = event.data?.order?.order_id;
  if (!orderNumber) return;

  const order = await Order.findOne({ orderNumber });
  if (!order) return;

  const payment = await ensurePaymentLedger(order);
  await markPaymentCancelledRepo(payment._id.toString(), "User dropped payment");

  // Keep order pending so student can retry / stale job can clean up
  logger.info("Payment user dropped", { orderNumber });
};

export const handleRefundStatusWebhook = async (
  event: CashfreeWebhookPayload,
): Promise<void> => {
  const orderNumber = event.data?.order?.order_id;
  if (!orderNumber) return;

  const order = await Order.findOne({ orderNumber });
  if (!order) return;

  const payment = await ensurePaymentLedger(order);
  const refundStatus = (
    event.data as {
      refund?: { refund_status?: string; cf_refund_id?: string };
    }
  )?.refund?.refund_status;

  const cfRefundId = (
    event.data as { refund?: { cf_refund_id?: string } }
  )?.refund?.cf_refund_id;

  if (
    refundStatus === "SUCCESS" ||
    refundStatus === "SUCCESSFULLY_PROCESSED" ||
    !refundStatus
  ) {
    await markPaymentRefundedRepo(payment._id.toString(), {
      cashfreeRefundId: cfRefundId,
      refundAmount: order.totalAmount,
      gatewayResponse: event.data as unknown as Record<string, unknown>,
    });

    await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $in: ["paid", "refunded"] } },
      { $set: { paymentStatus: "refunded" } },
    );
  }

  logger.info("Refund status webhook processed", {
    orderNumber,
    refundStatus,
  });
};

export const processCashfreeWebhookEvent = async (
  event: CashfreeWebhookPayload,
): Promise<{ duplicate: boolean }> => {
  const orderNumber = event.data?.order?.order_id ?? "";
  const eventKey = buildWebhookEventKey(event);

  const claimed = await claimWebhookEvent(eventKey, event.type, orderNumber);
  if (!claimed) {
    logger.info("Duplicate Cashfree webhook ignored", {
      eventKey,
      type: event.type,
    });
    return { duplicate: true };
  }

  switch (event.type) {
    case CASHFREE_WEBHOOK_EVENTS.PAYMENT_SUCCESS:
      await handlePaymentSuccessWebhook(event);
      break;
    case CASHFREE_WEBHOOK_EVENTS.PAYMENT_FAILED:
      await handlePaymentFailedWebhook(event);
      break;
    case CASHFREE_WEBHOOK_EVENTS.PAYMENT_USER_DROPPED:
      await handlePaymentUserDroppedWebhook(event);
      break;
    case CASHFREE_WEBHOOK_EVENTS.REFUND_STATUS:
      await handleRefundStatusWebhook(event);
      break;
    default:
      logger.info("Unhandled Cashfree webhook type", { type: event.type });
  }

  return { duplicate: false };
};

export const syncPaymentLedgerAfterCashfreeCreate = async (data: {
  orderId: string;
  userId: string;
  amount: number;
  cashfreeOrderId: string;
  paymentSessionId: string;
}) => {
  const existing = await findPaymentByOrderIdRepo(data.orderId);
  if (existing) {
    await updatePaymentCashfreeIdsRepo(data.orderId, {
      cashfreeOrderId: data.cashfreeOrderId,
      paymentSessionId: data.paymentSessionId,
    });
    return;
  }

  await createPaymentLedgerRepo({
    orderId: data.orderId,
    userId: data.userId,
    amount: data.amount,
    cashfreeOrderId: data.cashfreeOrderId,
    paymentSessionId: data.paymentSessionId,
    status: "pending",
  });
};
