import { Request, Response, NextFunction } from "express";

import {
  createOrderService,
  getStudentOrdersService,
  getOrderByNumberForStudentService,
  cancelOrderService,
  rateOrderService,
  markOrderPaidByOrderNumberService,
  verifyAndSyncOrderPaymentService,
} from "./order.service";

import { verifyCashfreeWebhookSignature } from "../../config/cashfree.config";
import { logger } from "../../config/logger.config";

/**
 * =========================================================
 * CREATE ORDER
 * =========================================================
 */
export const createOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req?.user?.id as string;

    const { cafeId, items, paymentMethod, notes, orderType, deliveryAddress } =
      req.body;

    const { order, paymentSessionId } = await createOrderService({
      studentId,
      cafeId,
      items,
      paymentMethod,
      notes,
      orderType,
      deliveryAddress,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
      paymentSessionId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * GET ORDERS BY STUDENT
 * =========================================================
 */
export const getMyOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req?.user?.id as string;

    const orders = await getStudentOrdersService(studentId);

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * GET ORDER BY ORDER NUMBER
 * =========================================================
 */
export const getOrderByNumberController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req?.user?.id as string;

    const order = await getOrderByNumberForStudentService(
      req.params.orderNumber,
      studentId,
    );

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * MANUAL VERIFY PAYMENT
 * =========================================================
 */
export const verifyOrderPaymentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req?.user?.id as string;

    const order = await verifyAndSyncOrderPaymentService(
      req.params.orderNumber,
      studentId,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * CANCEL ORDER
 * =========================================================
 */
export const cancelOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req?.user?.id as string;

    const order = await cancelOrderService({
      orderId: req.params.orderId,
      studentId,
      reason: req.body.reason,
    });

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * RATE ORDER
 * =========================================================
 */
export const rateOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req?.user?.id as string;

    const order = await rateOrderService({
      orderId: req.params.orderId,
      studentId,
      stars: req.body.stars,
      review: req.body.review,
    });

    res.status(200).json({
      success: true,
      message: "Order rated successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * CASHFREE WEBHOOK
 * =========================================================
 */
export const handleCashfreeWebhookController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const timestamp = req.headers["x-webhook-timestamp"] as string;
    const signature = req.headers["x-webhook-signature"] as string;

    if (!timestamp || !signature) {
      logger.warn("Cashfree webhook missing signature headers");

      res.status(400).json({
        success: false,
        message: "Missing signature headers",
      });

      return;
    }

    const rawBody = req.body.toString();

    if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
      res.status(401).json({
        success: false,
        message: "Invalid signature",
      });

      return;
    }

    const event = JSON.parse(rawBody);

    if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
      const orderNumber = event.data.order.order_id;
      await markOrderPaidByOrderNumberService(orderNumber);
    }

    res.status(200).json({
      success: true,
    });

    return;
  } catch (error) {
    next(error);
  }
};
