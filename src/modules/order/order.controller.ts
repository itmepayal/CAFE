import { Request, Response, NextFunction } from "express";

import {
  createOrderService,
  getStudentOrdersService,
  cancelOrderService,
  rateOrderService,
  markOrderPaidByCfOrderIdService,
} from "./order.service";

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
) => {
  try {
    const event = req.body;

    if (event.type === "PAYMENT_SUCCESS_WEBHOOK") {
      const cfOrderId = event.data.order.order_id;
      await markOrderPaidByCfOrderIdService(cfOrderId);
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
