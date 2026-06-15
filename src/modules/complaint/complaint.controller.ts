import { Request, Response, NextFunction } from "express";
import { createComplaintService } from "./complaint.service";
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
