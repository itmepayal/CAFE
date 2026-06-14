import { Request, Response, NextFunction } from "express";
import {
  createComplaintService,
  getMyComplaintsService,
  getAllComplaintsService,
  getComplaintByIdService,
  updateComplaintStatusService,
} from "./complaint.service";
import { uploadToCloudinary } from "../../config/cloudinary.config";

// =========================================
// CREATE COMPLAINT
// =========================================
export const createComplaintController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req?.user?.id as string;

    type ComplaintFiles = {
      attachments?: Express.Multer.File[];
    };

    const files = req.files as ComplaintFiles;

    const attachments = files.attachments?.length
      ? await Promise.all(
          files.attachments.map((file) =>
            uploadToCloudinary(file.path, "complaints"),
          ),
        )
      : [];

    const complaint = await createComplaintService(userId, {
      ...req.body,
      attachments,
    });

    res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      data: complaint,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// GET MY COMPLAINTS
// =========================================
export const getMyComplaintsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req?.user?.id as string;

    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await getMyComplaintsService(
      userId,
      status,
      category,
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
        totalPages: Math.ceil(result.total / result.limit),
      },
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
