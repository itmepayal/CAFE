import { Request, Response, NextFunction } from "express";
import {
  getAvailableDeliveryOrdersService,
  acceptDeliveryOrderService,
  getMyDeliveriesService,
  getDeliveryOrderByIdService,
  updateDeliveryStatusService,
  cancelDeliveryAssignmentService,
} from "./delivery.service";
import { DeliveryStatus } from "../order/order.constant";

/**
 * =========================================================
 * GET AVAILABLE DELIVERY ORDERS CONTROLLER
 * =========================================================
 */
export const getAvailableDeliveryOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cafeId = req.query.cafeId as string | undefined;
    const hostelName = req.query.hostelName as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await getAvailableDeliveryOrdersService({
      cafeId,
      hostelName,
      page,
      limit,
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
 * ACCEPT DELIVERY ORDER CONTROLLER
 * =========================================================
 */
export const acceptDeliveryOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const deliveryPersonId = req.user?.id as string;
    const { orderId } = req.params;

    const order = await acceptDeliveryOrderService(orderId, deliveryPersonId);

    res.status(200).json({
      success: true,
      message: "Delivery order accepted successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * GET MY DELIVERIES CONTROLLER
 * =========================================================
 */
export const getMyDeliveriesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const deliveryPersonId = req.user?.id as string;

    const active = req.query.active as boolean | undefined;
    const history = req.query.history as boolean | undefined;
    const deliveryStatus = req.query.deliveryStatus as DeliveryStatus | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await getMyDeliveriesService(deliveryPersonId, {
      active,
      history,
      deliveryStatus,
      page,
      limit,
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
 * GET DELIVERY ORDER DETAILS CONTROLLER
 * =========================================================
 */
export const getDeliveryOrderByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const deliveryPersonId = req.user?.id as string;
    const { orderId } = req.params;

    const order = await getDeliveryOrderByIdService(orderId, deliveryPersonId);

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
 * UPDATE DELIVERY STATUS CONTROLLER
 * =========================================================
 */
export const updateDeliveryStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const deliveryPersonId = req.user?.id as string;
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await updateDeliveryStatusService({
      orderId,
      deliveryPersonId,
      status,
    });

    res.status(200).json({
      success: true,
      message: `Delivery status updated to '${status}' successfully`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * CANCEL DELIVERY ASSIGNMENT CONTROLLER
 * =========================================================
 */
export const cancelDeliveryAssignmentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const deliveryPersonId = req.user?.id as string;
    const { orderId } = req.params;

    const order = await cancelDeliveryAssignmentService(orderId, deliveryPersonId);

    res.status(200).json({
      success: true,
      message: "Delivery assignment cancelled successfully. Order is back in available list.",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
