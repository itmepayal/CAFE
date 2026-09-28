import { Request, Response, NextFunction } from "express";
import { createComplaintService } from "./complaint.service";
import { uploadToCloudinary } from "../../config/cloudinary.config";
import { ApiResponse } from "../../utils/response/app.response";

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

    ApiResponse.success(res, "Complaint created successfully", complaint, 201);
  } catch (error) {
    next(error);
  }
};
