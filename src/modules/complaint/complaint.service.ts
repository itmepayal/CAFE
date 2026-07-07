import { logger } from "../../config/logger.config";
import { createComplaint } from "./complaint.repository";

// =========================================
// CREATE COMPLAINT SERVICE
// =========================================
export const createComplaintService = async (userId: string, data: any) => {
  logger.info(`Creating complaint for user: ${userId}`);

  const complaint = await createComplaint({
    ...data,
    userId,
  });

  logger.info(`Complaint created with id: ${complaint?._id}`);

  return complaint;
};
