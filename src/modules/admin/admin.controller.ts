import { Request, Response, NextFunction } from "express";

import {
  getAllUsersService,
  approveCafeService,
  rejectCafeService,
  toggleCafeBlockService,
} from "./admin.service";

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
    const users = await getAllUsersService();

    res.status(200).json({
      success: true,
      users,
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
    const cafe = await approveCafeService(req.params.id);

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
