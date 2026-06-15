import Complaint, { IComplaint } from "../../models/complaint";

// =========================================
// CREATE COMPLAINT
// =========================================
export const createComplaint = async (
  data: Partial<IComplaint>,
): Promise<IComplaint> => {
  return await Complaint.create(data);
};

// =========================================
// FIND MY COMPLAINTS
// =========================================
export const findMyComplaints = async (
  userId: string,
  status?: string,
  category?: string,
  page: number = 1,
  limit: number = 10,
): Promise<{
  complaints: IComplaint[];
  total: number;
  page: number;
  limit: number;
}> => {
  const filter: any = {
    userId,
  };

  if (status) {
    filter.status = status;
  }

  if (category) {
    filter.category = category;
  }

  const skip = (page - 1) * limit;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Complaint.countDocuments(filter),
  ]);

  return { complaints, total, page, limit };
};
