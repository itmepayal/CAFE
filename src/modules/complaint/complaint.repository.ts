import Complaint, { IComplaint } from "../../models/complaint";

// =========================================
// CREATE COMPLAINT
// =========================================
export const createComplaint = async (
  data: Partial<IComplaint>,
): Promise<IComplaint> => {
  return await Complaint.create(data);
};
