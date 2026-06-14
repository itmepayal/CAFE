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

// =========================================
// FIND ALL COMPLAINTS
// =========================================
export const findAllComplaints = async (
  status?: string,
  category?: string,
  priority?: string,
  page: number = 1,
  limit: number = 10,
): Promise<{
  complaints: IComplaint[];
  total: number;
  page: number;
  limit: number;
}> => {
  const filter: any = {};

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;

  const skip = (page - 1) * limit;

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate("userId", "name email role")
      .populate("cafeId", "cafeName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Complaint.countDocuments(filter),
  ]);

  return { complaints, total, page, limit };
};

// =========================================
// FIND COMPLAINT BY ID
// =========================================
export const findComplaintById = async (
  id: string,
): Promise<IComplaint | null> => {
  return await Complaint.findById(id);
};

// =========================================
// UPDATE COMPLAINT STATUS
// =========================================
export const updateComplaintStatus = async (
  id: string,
  status: "open" | "in_review" | "resolved" | "rejected" | "closed",
  adminNote?: string,
  resolution?: string,
  assignedTo?: string,
  adminId?: string,
): Promise<IComplaint | null> => {
  const now = new Date();

  const update: any = {
    status,
  };

  if (adminNote) update.adminNote = adminNote;
  if (resolution) update.resolution = resolution;
  if (assignedTo) update.assignedTo = assignedTo;

  if (status === "resolved") {
    update.resolvedAt = now;
  }

  if (status === "closed") {
    update.closedAt = now;
  }

  if (adminId) {
    update.assignedTo = assignedTo || adminId;
  }

  return await Complaint.findByIdAndUpdate(id, { $set: update }, { new: true });
};
