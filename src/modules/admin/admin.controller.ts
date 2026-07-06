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
} from "./admin.service";
import mongoose from "mongoose";

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
      cafe,
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
      cafe,
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
      cafe,
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
