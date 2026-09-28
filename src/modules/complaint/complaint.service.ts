import logger from "../../config/logger.config";
import { createComplaint } from "./complaint.repository";
import { findOrderByIdRepo } from "../order/order.repository";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../utils/errors/app.error";

export const createComplaintService = async (
  userId: string,
  data: {
    cafeId?: string;
    orderId?: string;
    category?: string;
    subject: string;
    description: string;
    priority?: string;
    attachments?: string[];
  },
) => {
  logger.info("Creating complaint", { userId });

  if (data.orderId) {
    const order = await findOrderByIdRepo(data.orderId);

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    const orderStudentId =
      (order.studentId as { _id?: { toString(): string } })?._id?.toString() ??
      order.studentId.toString();

    if (orderStudentId !== userId) {
      throw new ForbiddenError("You can only complain about your own orders");
    }

    const orderCafeId =
      (order.cafeId as { _id?: { toString(): string } })?._id?.toString() ??
      order.cafeId.toString();

    if (data.cafeId && data.cafeId !== orderCafeId) {
      throw new BadRequestError("Cafe does not match the order");
    }

    data.cafeId = orderCafeId;
  }

  if (!data.cafeId) {
    throw new BadRequestError("cafeId is required");
  }

  const complaint = await createComplaint({
    userId: userId as any,
    cafeId: data.cafeId as any,
    orderId: data.orderId as any,
    category: data.category as any,
    subject: data.subject,
    description: data.description,
    priority: data.priority as any,
    attachments: data.attachments,
  });

  logger.info("Complaint created", { complaintId: complaint?._id, userId });

  return complaint;
};
