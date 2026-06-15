import { Request, Response, NextFunction } from "express";

import {
  createOrderService,
  getOrderByIdService,
  getStudentOrdersService,
  getCafeOrdersService,
  updateOrderStatusService,
  cancelOrderService,
  rateOrderService,
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
    const sID = req?.user?.id as string;
    const order = await createOrderService({
      studentId: sID,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * GET ORDER BY ID
 * =========================================================
 */
export const getOrderByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    type UserRole = "student" | "cafe_owner" | "super_admin";
    const sID = req?.user?.id as string;
    const sRole = req?.user?.role as UserRole;
    const order = await getOrderByIdService(req.params.orderId, sID, sRole);

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
 * GET ORDERS BY STUDENT
 * =========================================================
 */
export const getMyOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sID = req?.user?.id as string;
    const orders = await getStudentOrdersService(sID);
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
 * GET ORDERS BY CAFE
 * =========================================================
 */
export const getCafeOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sID = req?.user?.id as string;
    const orders = await getCafeOrdersService(sID, req.query.status as any);

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
 * UPDATE ORDER STATUS
 * =========================================================
 * Update the status of an existing order.
 * Cafe owners can accept, reject, prepare, or complete orders.
 *
 * Access: Cafe Owner
 * Method: PATCH
 * Route: /orders/:orderId/status
 */
export const updateOrderStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cID = req?.user?.id as string;
    const order = await updateOrderStatusService({
      orderId: req.params.orderId,
      newStatus: req.body.status,
      cafeId: cID,
      estimatedReadyTime: req.body.estimatedReadyTime,
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
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
    type UserRole = "student" | "cafe_owner" | "super_admin";
    const sID = req?.user?.id as string;
    const sRole = req?.user?.role as UserRole;
    const order = await cancelOrderService({
      orderId: req.params.orderId,
      cancelledBy: sRole,
      requesterId: sID,
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
    const sID = req?.user?.id as string;
    const order = await rateOrderService({
      orderId: req.params.orderId,
      studentId: sID,
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
