import mongoose from "mongoose";
import User from "../../models/user";
import {
  findAllComplaints,
  findCafeByIdRepo,
  findComplaintById,
  findPendingCafes,
  getAllUsersRepo,
  saveCafeRepo,
  saveUserRepo,
  updateComplaintStatus,
  findAllOrdersRepo,
  findOrderByIdRepo,
  saveOrderRepo,
  getOrderStatsRepo,
} from "./admin.repository";
import { BadRequestError, NotFoundError } from "../../utils/errors/app.error";

/**
 * =========================================================
 * GET ALL USERS
 * =========================================================
 */
export const getAllUsersService = async (role?: string) => {
  return getAllUsersRepo(role);
};

/**
 * =========================================================
 * APPROVE CAFE
 * =========================================================
 */
export const approveCafeService = async (
  cafeId: string,
  adminId: mongoose.Types.ObjectId,
) => {
  const cafe = await findCafeByIdRepo(cafeId);

  if (cafe.isBlocked) {
    throw new BadRequestError(
      "Blocked cafes cannot be approved. Please unblock the cafe first.",
    );
  }

  if (cafe.status === "approved") {
    throw new BadRequestError("Cafe is already approved.");
  }

  if (cafe.status === "rejected") {
    throw new BadRequestError("Rejected cafes cannot be approved.");
  }

  const owner = await User.findById(cafe.userId);

  if (!owner) {
    throw new NotFoundError("Cafe owner not found");
  }

  cafe.status = "approved";
  cafe.approvedBy = adminId;
  cafe.approvedAt = new Date();
  cafe.adminNote = "";

  owner.role = "cafe_owner";
  owner.ownedCafe = cafe._id;

  await Promise.all([saveCafeRepo(cafe), saveUserRepo(owner)]);

  return cafe;
};

/**
 * =========================================================
 * REJECT CAFE
 * =========================================================
 */
export const rejectCafeService = async (cafeId: string, adminNote: string) => {
  const cafe = await findCafeByIdRepo(cafeId);

  if (cafe.status === "approved") {
    throw new BadRequestError(
      "Approved cafes cannot be rejected. Block or suspend the cafe instead.",
    );
  }

  if (cafe.status === "rejected") {
    throw new BadRequestError("Cafe has already been rejected.");
  }

  cafe.status = "rejected";
  cafe.isApproved = false;
  cafe.adminNote = adminNote;
  cafe.rejectedAt = new Date();

  return await saveCafeRepo(cafe);
};

/**
 * =========================================================
 * BLOCK / UNBLOCK CAFE
 * =========================================================
 */
export const toggleCafeBlockService = async (cafeId: string) => {
  const cafe = await findCafeByIdRepo(cafeId);
  if (cafe.status !== "approved") {
    throw new BadRequestError(
      "Only approved cafes can be blocked or unblocked.",
    );
  }
  cafe.isBlocked = !cafe.isBlocked;
  return await saveCafeRepo(cafe);
};

// =========================================
// GET PENDING CAFES
// =========================================
export const getPendingCafesService = async () => {
  return await findPendingCafes();
};

// =========================================
// GET ALL COMPLAINTS SERVICE
// =========================================
export const getAllComplaintsService = async (
  status?: string,
  category?: string,
  priority?: string,
  page?: number,
  limit?: number,
) => {
  return await findAllComplaints(status, category, priority, page, limit);
};

// =========================================
// GET COMPLAINT BY ID SERVICE
// =========================================
export const getComplaintByIdService = async (id: string) => {
  return await findComplaintById(id);
};

// =========================================
// UPDATE COMPLAINT STATUS SERVICE
// =========================================
export const updateComplaintStatusService = async (
  id: string,
  status: any,
  adminNote?: string,
  resolution?: string,
  assignedTo?: string,
  adminId?: string,
) => {
  return await updateComplaintStatus(
    id,
    status,
    adminNote,
    resolution,
    assignedTo,
    adminId,
  );
};

// =========================================
// GET ALL ORDERS
// =========================================
export const getAllOrdersService = async (
  filters: any,
  page: number,
  limit: number,
) => {
  return findAllOrdersRepo(filters, page, limit);
};

// =========================================
// GET ORDER BY ID
// =========================================
export const getOrderByIdService = async (orderId: string) => {
  const order = await findOrderByIdRepo(orderId);
  if (!order) throw new NotFoundError("Order not found");
  return order;
};

// =========================================
// FORCE CANCEL ORDER (any status)
// =========================================
export const forceCancelOrderService = async (
  orderId: string,
  reason: string,
) => {
  const order = await findOrderByIdRepo(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (["completed", "cancelled"].includes(order.status)) {
    throw new BadRequestError(
      `Order is already ${order.status}, cannot cancel.`,
    );
  }

  order.status = "cancelled";
  order.cancelledBy = "super_admin";
  order.cancellationReason = reason || "Cancelled by admin";
  order.cancelledAt = new Date();
  order.isOpen = false;

  return saveOrderRepo(order);
};

// =========================================
// MARK ORDER REFUNDED
// =========================================
export const refundOrderService = async (orderId: string) => {
  const order = await findOrderByIdRepo(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (order.paymentStatus !== "paid") {
    throw new BadRequestError("Only paid orders can be refunded.");
  }

  order.paymentStatus = "refunded";
  return saveOrderRepo(order);
};

// =========================================
// ORDER STATS
// =========================================
export const getOrderStatsService = async () => {
  return getOrderStatsRepo();
};
