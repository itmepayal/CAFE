import { Request, Response, NextFunction } from "express";

import {
  getAllUsersService,
  approveCafeService,
  rejectCafeService,
  toggleCafeBlockService,
  getPendingCafesService,
  updateComplaintStatusService,
  getComplaintByIdService,
  getAllComplaintsService,
  getAllOrdersService,
  getOrderByIdService,
  forceCancelOrderService,
  refundOrderService,
  getOrderStatsService,
  getDashboardStatsService,
  getPaymentsService,
  getAllCafesService,
  getCafeByIdForAdminService,
  toggleCafeOpenService,
  toggleCafeVisibilityService,
  getSettlementsService,
  markSettlementAsSettledService,
} from "./admin.service";
import mongoose from "mongoose";
import { cancelSpecificStaleOrderService } from "../owner/owner.service";
import {
  createAdminInviteService,
  listAdminInvitesService,
} from "./admin-invite.service";

/**
 * =========================================================
 * GET ALL USERS
 * =========================================================
 */
export const getAllUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { role } = req.query;

    const users = await getAllUsersService(role as string | undefined);

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * APPROVE CAFE
 * =========================================================
 */
export const approveCafeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req?.user?.id);
    const cafe = await approveCafeService(req.params.id, adminId);
    res.status(200).json({
      success: true,
      message: "Cafe approved successfully",
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * REJECT CAFE
 * =========================================================
 */
export const rejectCafeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cafe = await rejectCafeService(req.params.id, req.body.adminNote);

    res.status(200).json({
      success: true,
      message: "Cafe rejected successfully",
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * BLOCK / UNBLOCK CAFE
 * =========================================================
 */
export const toggleCafeBlockController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cafe = await toggleCafeBlockService(req.params.id);

    res.status(200).json({
      success: true,
      message: cafe.isBlocked
        ? "Cafe blocked successfully"
        : "Cafe unblocked successfully",
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// GET PENDING CAFES
// =========================================
export const getPendingCafesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cafes = await getPendingCafesService();

    res.json({
      success: true,
      data: cafes,
    });
  } catch (error) {
    next(error);
  }
};
// =========================================
// GET ALL COMPLAINTS
// =========================================
export const getAllComplaintsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const priority = req.query.priority as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await getAllComplaintsService(
      status,
      category,
      priority,
      page,
      limit,
    );

    res.json({
      success: true,
      data: result.complaints,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// GET SINGLE COMPLAINT
// =========================================
export const getComplaintByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const complaint = await getComplaintByIdService(req.params.id);

    res.json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// UPDATE COMPLAINT STATUS
// =========================================
export const updateComplaintStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const adminId = req?.user?.id as string;
    const { status, adminNote, resolution, assignedTo } = req.body;

    const complaint = await updateComplaintStatusService(
      req.params.id,
      status,
      adminNote,
      resolution,
      assignedTo,
      adminId,
    );

    res.json({
      success: true,
      message: "Complaint updated successfully",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// TRIGGER SPECIFIC ORDER CANCEL
// =========================================
export const triggerSpecificOrderCancelController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { orderId } = req.params;
    await cancelSpecificStaleOrderService(orderId);
    res.status(200).json({
      success: true,
      message: `Order ${orderId} cancelled successfully`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * GET ALL ORDERS
 * =========================================
 */
export const getAllOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      status,
      paymentStatus,
      orderType,
      cafeId,
      studentId,
      dateFrom,
      dateTo,
    } = req.query;

    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await getAllOrdersService(
      {
        status: status as string | undefined,
        paymentStatus: paymentStatus as string | undefined,
        orderType: orderType as string | undefined,
        cafeId: cafeId as string | undefined,
        studentId: studentId as string | undefined,
        dateFrom: dateFrom as string | undefined,
        dateTo: dateTo as string | undefined,
      },
      page,
      limit,
    );

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * GET SINGLE ORDER
 * =========================================
 */
export const getOrderByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const order = await getOrderByIdService(req.params.id);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * FORCE CANCEL ORDER
 * =========================================
 */
export const forceCancelOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { reason } = req.body;

    const order = await forceCancelOrderService(req.params.id, reason);

    res.status(200).json({
      success: true,
      message: "Order cancelled by admin",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * REFUND ORDER
 * =========================================
 */
export const refundOrderController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const order = await refundOrderService(req.params.id);

    res.status(200).json({
      success: true,
      message: "Order marked as refunded",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * GET ORDER STATS
 * =========================================
 */
export const getOrderStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stats = await getOrderStatsService();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const createAdminInviteController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const adminId = req.user!.id;
    const { email } = req.body;

    const invite = await createAdminInviteService(adminId, email);

    res.status(201).json({
      success: true,
      message: "Admin invite created successfully",
      data: invite,
    });
  } catch (error) {
    next(error);
  }
};

export const listAdminInvitesController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const invites = await listAdminInvitesService();

    res.status(200).json({
      success: true,
      data: invites,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * ADMIN DASHBOARD
 * =========================================
 */
export const getDashboardStatsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stats = await getDashboardStatsService();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * ADMIN PAYMENTS
 * =========================================
 */
export const getPaymentsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const paymentStatus = req.query.paymentStatus as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await getPaymentsService(paymentStatus, page, limit);

    res.status(200).json({
      success: true,
      data: {
        summary: result.summary,
        transactions: result.transactions,
      },
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * ADMIN SETTLEMENTS
 * =========================================
 */
export const getSettlementsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cafeId = req.query.cafeId as string | undefined;
    const status = req.query.status as "pending" | "settled" | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await getSettlementsService(cafeId, status, page, limit);

    res.status(200).json({
      success: true,
      data: result.settlements,
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

export const markSettlementAsSettledController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const adminId = req.user!.id;
    const { settlementId } = req.params;

    const settlement = await markSettlementAsSettledService(
      settlementId,
      adminId,
    );

    res.status(200).json({
      success: true,
      message: "Settlement marked as settled",
      data: settlement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * ADMIN — ALL CAFES
 * =========================================
 */
export const getAllCafesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const isBlocked =
      req.query.isBlocked !== undefined
        ? req.query.isBlocked === "true"
        : undefined;
    const isVisible =
      req.query.isVisible !== undefined
        ? req.query.isVisible === "true"
        : undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await getAllCafesService(
      { status, search, isBlocked, isVisible },
      page,
      limit,
    );

    res.status(200).json({
      success: true,
      data: result.cafes,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * ADMIN — CAFE BY ID
 * =========================================
 */
export const getCafeByIdForAdminController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cafe = await getCafeByIdForAdminService(req.params.id);

    res.status(200).json({
      success: true,
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================
 * ADMIN — TOGGLE CAFE OPEN/CLOSE
 * =========================================
 */
export const toggleCafeOpenController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cafe = await toggleCafeOpenService(req.params.id);

    res.status(200).json({
      success: true,
      message: cafe.isOpen ? "Cafe opened successfully" : "Cafe closed successfully",
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};

export const toggleCafeVisibilityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cafe = await toggleCafeVisibilityService(req.params.id);

    res.status(200).json({
      success: true,
      message: cafe.isVisible
        ? "Cafe is now visible to students"
        : "Cafe is now hidden from students",
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};
