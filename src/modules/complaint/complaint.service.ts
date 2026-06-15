import { createComplaint, findMyComplaints } from "./complaint.repository";

// =========================================
// CREATE COMPLAINT SERVICE
// =========================================
export const createComplaintService = async (userId: string, data: any) => {
  return await createComplaint({
    ...data,
    userId,
  });
};

// =========================================
// GET MY COMPLAINTS SERVICE
// =========================================
export const getMyComplaintsService = async (
  userId: string,
  status?: string,
  category?: string,
  page?: number,
  limit?: number,
) => {
  return await findMyComplaints(userId, status, category, page, limit);
};
