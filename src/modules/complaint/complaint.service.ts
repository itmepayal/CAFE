import { createComplaint } from "./complaint.repository";

// =========================================
// CREATE COMPLAINT SERVICE
// =========================================
export const createComplaintService = async (userId: string, data: any) => {
  return await createComplaint({
    ...data,
    userId,
  });
};
