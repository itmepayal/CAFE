import { createCashfreeRefund } from "../../config/cashfree.config";
import { IOrder } from "../../models/order";
import logger from "../../config/logger.config";
import { BadRequestError, InternalServerError } from "../../utils/errors/app.error";

export interface RefundResult {
  refunded: boolean;
  refundId?: string;
  localOnly?: boolean;
}

export const processOrderRefund = async (
  order: IOrder,
  reason: string,
): Promise<RefundResult> => {
  if (order.paymentStatus !== "paid") {
    return { refunded: false };
  }

  if (order.paymentMethod === "cash") {
    logger.info("Cash order marked for local refund only", {
      orderId: order._id,
      orderNumber: order.orderNumber,
    });
    return { refunded: true, localOnly: true };
  }

  if (!order.orderNumber) {
    throw new BadRequestError("Order number missing; cannot process refund.");
  }

  const refundId = `refund_${order.orderNumber}_${Date.now()}`;

  try {
    const cfRefund = await createCashfreeRefund({
      orderId: order.orderNumber,
      refundAmount: order.totalAmount,
      refundId,
      refundNote: reason.slice(0, 200),
    });

    logger.info("Cashfree refund initiated", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      refundId,
      cfRefundId: cfRefund?.cf_refund_id,
    });

    return {
      refunded: true,
      refundId: cfRefund?.cf_refund_id ?? refundId,
    };
  } catch (error) {
    logger.error("Cashfree refund failed", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      error,
    });

    throw new InternalServerError(
      "Refund could not be processed. Please contact support.",
    );
  }
};
