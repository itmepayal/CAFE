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
  getDashboardStatsRepo,
  getPaymentsRepo,
  findAllCafesRepo,
  findCafeByIdForAdminRepo,
} from "./admin.repository";
import { BadRequestError, NotFoundError } from "../../utils/errors/app.error";
import { processOrderRefund } from "../payment/refund.service";
import {
  emitAdminCafeUpdated,
  notifyAdminPaymentUpdate,
  toAdminPaymentPayload,
} from "../../socket/admin";
import {
  getAdminSettlementsService,
  settleSettlementService,
} from "../settlement/settlement.service";
import { writeAuditLog } from "../../utils/audit/audit-log";
import { assertPermission, PERMISSIONS } from "../../utils/auth/permissions";

/**
 * =========================================================
 * GET ALL USERS
 * =========================================================
 */
export const getAllUsersService = async (
  role?: string,
  page: number = 1,
  limit: number = 50,
) => {
  return getAllUsersRepo(role, page, limit);
};

/**
 * =========================================================
 * APPROVE CAFE
 * =========================================================
 */
export const approveCafeService = async (
  cafeId: string,
  adminId: mongoose.Types.ObjectId,
  requestId?: string,
) => {
  assertPermission("super_admin", PERMISSIONS.ADMIN_MANAGE_CAFES);
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
  cafe.isVisible = true;

  owner.role = "cafe_owner";
  owner.ownedCafe = cafe._id;

  await Promise.all([saveCafeRepo(cafe), saveUserRepo(owner)]);

  emitAdminCafeUpdated(cafe, "approved");

  await writeAuditLog({
    actorId: adminId.toString(),
    actorRole: "super_admin",
    action: "cafe.approve",
    targetType: "cafe",
    targetId: cafeId,
    requestId,
  });

  return cafe;
};

/**
 * =========================================================
 * REJECT CAFE
 * =========================================================
 */
export const rejectCafeService = async (
  cafeId: string,
  adminNote: string,
  adminId?: string,
  requestId?: string,
) => {
  assertPermission("super_admin", PERMISSIONS.ADMIN_MANAGE_CAFES);
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
  cafe.isVisible = false;
  cafe.adminNote = adminNote;
  cafe.rejectedAt = new Date();

  const savedCafe = await saveCafeRepo(cafe);

  emitAdminCafeUpdated(savedCafe, "rejected");

  if (adminId) {
    await writeAuditLog({
      actorId: adminId,
      actorRole: "super_admin",
      action: "cafe.reject",
      targetType: "cafe",
      targetId: cafeId,
      requestId,
      metadata: { adminNote },
    });
  }

  return savedCafe;
};

/**
 * =========================================================
 * BLOCK / UNBLOCK CAFE
 * =========================================================
 */
export const toggleCafeBlockService = async (
  cafeId: string,
  adminId?: string,
  requestId?: string,
) => {
  assertPermission("super_admin", PERMISSIONS.ADMIN_MANAGE_CAFES);
  const cafe = await findCafeByIdRepo(cafeId);
  if (cafe.status !== "approved") {
    throw new BadRequestError(
      "Only approved cafes can be blocked or unblocked.",
    );
  }
  cafe.isBlocked = !cafe.isBlocked;

  if (cafe.isBlocked) {
    cafe.isVisible = false;
  }

  const savedCafe = await saveCafeRepo(cafe);

  emitAdminCafeUpdated(savedCafe, savedCafe.isBlocked ? "blocked" : "unblocked");

  if (adminId) {
    await writeAuditLog({
      actorId: adminId,
      actorRole: "super_admin",
      action: savedCafe.isBlocked ? "cafe.block" : "cafe.unblock",
      targetType: "cafe",
      targetId: cafeId,
      requestId,
    });
  }

  return savedCafe;
};

export const toggleCafeVisibilityService = async (cafeId: string) => {
  const cafe = await findCafeByIdRepo(cafeId);

  if (cafe.status !== "approved") {
    throw new BadRequestError(
      "Only approved cafes can have visibility changed.",
    );
  }

  if (cafe.isBlocked) {
    throw new BadRequestError(
      "Blocked cafes cannot be shown. Unblock the cafe first.",
    );
  }

  cafe.isVisible = !cafe.isVisible;
  const savedCafe = await saveCafeRepo(cafe);

  emitAdminCafeUpdated(savedCafe, "visibility_toggled");

  return savedCafe;
};

export const toggleCafeOpenService = async (cafeId: string) => {
  const cafe = await findCafeByIdRepo(cafeId);

  if (cafe.status !== "approved") {
    throw new BadRequestError("Only approved cafes can be opened or closed.");
  }

  if (cafe.isBlocked) {
    throw new BadRequestError("Blocked cafes cannot be opened or closed.");
  }

  if (!cafe.isVisible) {
    throw new BadRequestError(
      "Hidden cafes cannot be opened or closed. Make the cafe visible first.",
    );
  }

  cafe.isOpen = !cafe.isOpen;
  const savedCafe = await saveCafeRepo(cafe);

  emitAdminCafeUpdated(savedCafe, "open_toggled");

  return savedCafe;
};

// =========================================
// GET PENDING CAFES
// =========================================
export const getPendingCafesService = async (
  page: number = 1,
  limit: number = 50,
) => {
  return await findPendingCafes(page, limit);
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
export const refundOrderService = async (
  orderId: string,
  adminId?: string,
  requestId?: string,
) => {
  assertPermission("super_admin", PERMISSIONS.ADMIN_REFUND);
  const order = await findOrderByIdRepo(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (order.paymentStatus === "refunded") {
    return order;
  }

  if (order.paymentStatus !== "paid" && order.paymentStatus !== "refund_pending") {
    throw new BadRequestError("Only paid orders can be refunded.");
  }

  await processOrderRefund(order, "Admin initiated refund");

  const savedOrder = await findOrderByIdRepo(orderId);
  if (!savedOrder) {
    throw new NotFoundError("Order not found");
  }

  notifyAdminPaymentUpdate(
    toAdminPaymentPayload(savedOrder),
    "order_refunded",
  );

  if (adminId) {
    await writeAuditLog({
      actorId: adminId,
      actorRole: "super_admin",
      action: "order.refund",
      targetType: "order",
      targetId: orderId,
      requestId,
    });
  }

  return savedOrder;
};

// =========================================
// ORDER STATS
// =========================================
export const getOrderStatsService = async () => {
  return getOrderStatsRepo();
};

// =========================================
// ADMIN DASHBOARD
// =========================================
export const getDashboardStatsService = async () => {
  return getDashboardStatsRepo();
};

// =========================================
// ADMIN PAYMENTS
// =========================================
export const getPaymentsService = async (
  paymentStatus?: string,
  page: number = 1,
  limit: number = 10,
) => {
  return getPaymentsRepo(paymentStatus, page, limit);
};

// =========================================
// ADMIN — ALL CAFES
// =========================================
export const getAllCafesService = async (
  filters: {
    status?: string;
    search?: string;
    isBlocked?: boolean;
    isVisible?: boolean;
  },
  page: number,
  limit: number,
) => {
  const result = await findAllCafesRepo(filters, page, limit);

  const cafes = result.cafes.map((cafe: any) => ({
    ...cafe,
    statusLabel: cafe.isOpen ? "OPEN" : "CLOSED",
  }));

  return { ...result, cafes };
};

// =========================================
// ADMIN — CAFE BY ID
// =========================================
export const getCafeByIdForAdminService = async (cafeId: string) => {
  return findCafeByIdForAdminRepo(cafeId);
};

// =========================================
// ADMIN — SETTLEMENTS
// =========================================
export const getSettlementsService = async (
  cafeId?: string,
  status?: "pending" | "settled",
  page: number = 1,
  limit: number = 10,
) => {
  return getAdminSettlementsService({ cafeId, status, page, limit });
};

export const markSettlementAsSettledService = async (
  settlementId: string,
  adminId: string,
  requestId?: string,
) => {
  assertPermission("super_admin", PERMISSIONS.ADMIN_SETTLE);
  const result = await settleSettlementService(settlementId, adminId);
  await writeAuditLog({
    actorId: adminId,
    actorRole: "super_admin",
    action: "settlement.settle",
    targetType: "settlement",
    targetId: settlementId,
    requestId,
  });
  return result;
};
