import { Request, Response, NextFunction } from "express";

import {
  createOrderService,
  createOrderFromCartService,
  getStudentOrdersService,
  getOrderByNumberForStudentService,
  cancelOrderService,
  rateOrderService,
  verifyAndSyncOrderPaymentService,
} from "./order.service";

import { verifyCashfreeWebhookSignature } from "../../config/cashfree.config";
import logger from "../../config/logger.config";
import {
  isWebhookTimestampFresh,
  processCashfreeWebhookEvent,
} from "../payment/webhook.service";
import { CashfreeWebhookPayload } from "../payment/payment.type";
import { ApiResponse } from "../../utils/response/app.response";

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
 * CREATE ORDER FROM CART
 * =========================================================
 */
export const createOrderFromCartController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const studentId = req?.user?.id as string;
    const { paymentMethod, notes, orderType, deliveryAddress } = req.body;

    const { order, paymentSessionId } = await createOrderFromCartService(
      studentId,
      {
        paymentMethod,
        notes,
        orderType,
        deliveryAddress,
      },
    );

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

    const result = await getStudentOrdersService(studentId, {
      active: req.query.active as boolean | undefined,
      history: req.query.history as boolean | undefined,
      orderType: req.query.orderType as "pickup" | "delivery" | undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.pages,
      },
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

    ApiResponse.success(res, "Order fetched", order);
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

    ApiResponse.success(res, "Payment verified", order);
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

    ApiResponse.success(res, "Order cancelled successfully", order);
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

    ApiResponse.success(res, "Order rated successfully", order);
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

    if (!isWebhookTimestampFresh(timestamp)) {
      logger.warn("Cashfree webhook timestamp outside allowed skew", {
        timestamp,
      });

      res.status(400).json({
        success: false,
        message: "Stale webhook timestamp",
      });

      return;
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : JSON.stringify(req.body);

    if (!verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
      res.status(401).json({
        success: false,
        message: "Invalid signature",
      });

      return;
    }

    const event = JSON.parse(rawBody) as CashfreeWebhookPayload;

    await processCashfreeWebhookEvent(event);

    res.status(200).json({
      success: true,
    });

    return;
  } catch (error) {
    next(error);
  }
};
