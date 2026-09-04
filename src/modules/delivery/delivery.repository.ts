import Order, { IOrder } from "../../models/order";
import logger from "../../config/logger.config";
import { InternalServerError, NotFoundError } from "../../utils/errors/app.error";
import {
  GetAvailableDeliveryOrdersQuery,
  GetMyDeliveriesQuery,
  DeliveryPaginatedResult,
} from "./delivery.type";
import mongoose from "mongoose";

/**
 * =========================================================
 * FIND AVAILABLE DELIVERY ORDERS
 * =========================================================
 */
export const findAvailableDeliveryOrdersRepo = async (
  query: GetAvailableDeliveryOrdersQuery,
): Promise<DeliveryPaginatedResult<IOrder>> => {
  try {
    const filter: Record<string, unknown> = {
      orderType: "delivery",
      deliveryStatus: "not_assigned",
      status: { $in: ["accepted", "preparing", "ready"] },
    };

    if (query.cafeId) {
      filter.cafeId = new mongoose.Types.ObjectId(query.cafeId);
    }

    if (query.hostelName) {
      filter["deliveryAddress.hostelName"] = {
        $regex: query.hostelName,
        $options: "i",
      };
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("studentId", "name email phone profileImage hostel")
        .populate("cafeId", "name address phone cafeImage location"),
      Order.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    logger.error("Failed to fetch available delivery orders", { query, error });
    throw new InternalServerError("Failed to fetch available delivery orders");
  }
};

/**
 * =========================================================
 * ATOMICALLY CLAIM A DELIVERY ORDER
 * =========================================================
 */
export const claimDeliveryOrderRepo = async (
  orderId: string,
  deliveryPersonId: string,
): Promise<IOrder | null> => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        orderType: "delivery",
        deliveryStatus: "not_assigned",
        status: { $in: ["accepted", "preparing", "ready"] },
      },
      {
        $set: {
          deliveryPersonId: new mongoose.Types.ObjectId(deliveryPersonId),
          deliveryStatus: "assigned",
        },
        $push: {
          statusHistory: {
            status: "delivery_assigned",
            changedAt: new Date(),
          },
        },
      },
      { new: true },
    )
      .populate("studentId", "name email phone profileImage hostel")
      .populate("cafeId", "name address phone cafeImage")
      .populate("deliveryPersonId", "name email phone profileImage");

    return updatedOrder;
  } catch (error) {
    logger.error("Failed to claim delivery order", { orderId, deliveryPersonId, error });
    throw new InternalServerError("Failed to claim delivery order");
  }
};

/**
 * =========================================================
 * FIND STUDENT DELIVERIES
 * =========================================================
 */
export const findStudentDeliveriesRepo = async (
  deliveryPersonId: string,
  query: GetMyDeliveriesQuery,
): Promise<DeliveryPaginatedResult<IOrder>> => {
  try {
    const filter: Record<string, unknown> = {
      deliveryPersonId: new mongoose.Types.ObjectId(deliveryPersonId),
    };

    if (query.active) {
      filter.deliveryStatus = { $in: ["assigned", "out_for_delivery"] };
    } else if (query.history) {
      filter.deliveryStatus = "delivered";
    } else if (query.deliveryStatus) {
      filter.deliveryStatus = query.deliveryStatus;
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Order.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("studentId", "name email phone profileImage hostel")
        .populate("cafeId", "name address phone cafeImage location")
        .populate("deliveryPersonId", "name email phone profileImage"),
      Order.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    logger.error("Failed to fetch student deliveries", { deliveryPersonId, query, error });
    throw new InternalServerError("Failed to fetch student deliveries");
  }
};

/**
 * =========================================================
 * FIND DELIVERY ORDER BY ID
 * =========================================================
 */
export const findDeliveryOrderByIdRepo = async (
  orderId: string,
): Promise<IOrder> => {
  try {
    const order = await Order.findById(orderId)
      .populate("studentId", "name email phone profileImage hostel")
      .populate("cafeId", "name address phone cafeImage location")
      .populate("deliveryPersonId", "name email phone profileImage");

    if (!order) {
      throw new NotFoundError("Delivery order not found");
    }

    return order;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error("Failed to fetch delivery order by ID", { orderId, error });
    throw new InternalServerError("Failed to fetch delivery order");
  }
};

/**
 * =========================================================
 * UPDATE DELIVERY STATUS IN DB
 * =========================================================
 */
export const updateDeliveryStatusInDbRepo = async (
  orderId: string,
  deliveryPersonId: string,
  newDeliveryStatus: "out_for_delivery" | "delivered",
): Promise<IOrder | null> => {
  try {
    const updateDoc: Record<string, unknown> = {
      deliveryStatus: newDeliveryStatus,
    };

    const pushDoc: Record<string, unknown> = {
      statusHistory: {
        status: `delivery_${newDeliveryStatus}`,
        changedAt: new Date(),
      },
    };

    if (newDeliveryStatus === "out_for_delivery") {
      updateDoc.status = "out_for_delivery";
      updateDoc.outForDeliveryAt = new Date();
    } else if (newDeliveryStatus === "delivered") {
      updateDoc.status = "completed";
      updateDoc.completedAt = new Date();
    }

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryPersonId: new mongoose.Types.ObjectId(deliveryPersonId),
      },
      {
        $set: updateDoc,
        $push: pushDoc,
      },
      { new: true },
    )
      .populate("studentId", "name email phone profileImage hostel")
      .populate("cafeId", "name address phone cafeImage location")
      .populate("deliveryPersonId", "name email phone profileImage");

    return updatedOrder;
  } catch (error) {
    logger.error("Failed to update delivery status", {
      orderId,
      deliveryPersonId,
      newDeliveryStatus,
      error,
    });
    throw new InternalServerError("Failed to update delivery status");
  }
};

/**
 * =========================================================
 * CANCEL DELIVERY ASSIGNMENT REPO
 * =========================================================
 */
export const cancelDeliveryAssignmentRepo = async (
  orderId: string,
  deliveryPersonId: string,
): Promise<IOrder | null> => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryPersonId: new mongoose.Types.ObjectId(deliveryPersonId),
        deliveryStatus: { $in: ["assigned"] }, // only assigned can be un-assigned by partner before out_for_delivery
      },
      {
        $set: {
          deliveryPersonId: null,
          deliveryStatus: "not_assigned",
        },
        $push: {
          statusHistory: {
            status: "delivery_unassigned",
            changedAt: new Date(),
          },
        },
      },
      { new: true },
    )
      .populate("studentId", "name email phone profileImage hostel")
      .populate("cafeId", "name address phone cafeImage location");

    return updatedOrder;
  } catch (error) {
    logger.error("Failed to cancel delivery assignment", {
      orderId,
      deliveryPersonId,
      error,
    });
    throw new InternalServerError("Failed to cancel delivery assignment");
  }
};
