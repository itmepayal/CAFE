import { Request, Response, NextFunction } from "express";
import {
  createComplaintService,
  getMyComplaintsService,
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
