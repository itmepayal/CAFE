import Order, { IOrder } from "../../models/order";
import logger from "../../config/logger.config";

import {
  InternalServerError,
  NotFoundError,
} from "../../utils/errors/app.error";

/**
 * =========================================================
 * CREATE ORDER
 * =========================================================
 */
export const createOrderRepo = async (
  data: Partial<IOrder>,
): Promise<IOrder> => {
  try {
    return await Order.create(data);
  } catch (error) {
    logger.error("Failed to create order", { error });

    throw new InternalServerError("Failed to create order");
  }
};

/**
 * =========================================================
 * FIND ORDER BY ID
 * =========================================================
 */
export const findOrderByIdRepo = async (orderId: string): Promise<IOrder> => {
  try {
    const order = await Order.findById(orderId)
      .populate("studentId", "name email profileImage")
      .populate("cafeId");

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return order;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    logger.error("Failed to fetch order", {
      orderId,
      error,
    });

    throw new InternalServerError("Failed to fetch order");
  }
};

/**
 * =========================================================
 * FIND ORDER BY ORDER NUMBER
 * =========================================================
 */
export const findOrderByOrderNumberRepo = async (
  orderNumber: string,
): Promise<IOrder> => {
  try {
    const order = await Order.findOne({ orderNumber })
      .populate("studentId", "name email profileImage")
      .populate("cafeId");

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return order;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    logger.error("Failed to fetch order by order number", {
      orderNumber,
      error,
    });

    throw new InternalServerError("Failed to fetch order");
  }
};

/**
 * =========================================================
 * UPDATE ORDER STATUS
 * =========================================================
 */
export const updateOrderStatusRepo = async (
  orderId: string,
  status: IOrder["status"],
  extraFields: Partial<IOrder> = {},
): Promise<IOrder> => {
  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status,
        ...extraFields,
        $push: {
          statusHistory: {
            status,
            changedAt: new Date(),
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return order;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    logger.error("Failed to update order status", {
      orderId,
      status,
      error,
    });

    throw new InternalServerError("Failed to update order status");
  }
};

/**
 * =========================================================
 * FIND ORDERS BY STUDENT
 * =========================================================
 */
export const findOrdersByStudentRepo = async (
  studentId: string,
): Promise<IOrder[]> => {
  try {
    return await Order.find({ studentId })
      .populate("cafeId")
      .sort({ createdAt: -1 })
      .lean<IOrder[]>();
  } catch (error) {
    logger.error("Failed to fetch student orders", {
      studentId,
      error,
    });

    throw new InternalServerError("Failed to fetch student orders");
  }
};

/**
 * =========================================================
 * FIND ORDERS BY CAFE
 * =========================================================
 */
export const findOrdersByCafeRepo = async (
  cafeId: string,
  status?: IOrder["status"],
): Promise<IOrder[]> => {
  try {
    const query: {
      cafeId: string;
      status?: IOrder["status"];
    } = { cafeId };

    if (status) {
      query.status = status;
    }

    return await Order.find(query)
      .populate("studentId", "name email profileImage")
      .sort({ createdAt: -1 })
      .lean<IOrder[]>();
  } catch (error) {
    logger.error("Failed to fetch cafe orders", {
      cafeId,
      status,
      error,
    });

    throw new InternalServerError("Failed to fetch cafe orders");
  }
};

/**
 * =========================================================
 * CANCEL ORDER
 * =========================================================
 */
export const cancelOrderRepo = async (
  orderId: string,
  cancelledBy: "student" | "cafe_owner" | "super_admin",
  reason: string,
): Promise<IOrder> => {
  try {
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        status: "cancelled",
        cancelledBy,
        cancellationReason: reason,
        cancelledAt: new Date(),
        $push: {
          statusHistory: {
            status: "cancelled",
            changedAt: new Date(),
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    return order;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }

    logger.error("Failed to cancel order", {
      orderId,
      cancelledBy,
      error,
    });

    throw new InternalServerError("Failed to cancel order");
  }
};
