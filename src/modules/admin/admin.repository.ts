import User, { IUser } from "../../models/user";
import Cafe, { ICafe } from "../../models/cafe";

import {
  InternalServerError,
  NotFoundError,
} from "../../utils/errors/app.error";
import Complaint, { IComplaint } from "../../models/complaint";

/**
 * =========================================================
 * GET ALL USERS
 * =========================================================
 */
export const getAllUsersRepo = async (role?: string) => {
  const filter: Record<string, any> = {};

  if (role) {
    filter.role = role;
  }

  return User.find(filter)
    .select("-deviceTokens")
    .populate("ownedCafe")
    .sort({ createdAt: -1 })
    .catch(() => {
      throw new InternalServerError("Failed to fetch users");
    });
};

/**
 * =========================================================
 * FIND CAFE
 * =========================================================
 */
export const findCafeByIdRepo = async (cafeId: string): Promise<ICafe> => {
  const cafe = await Cafe.findById(cafeId).catch(() => {
    throw new InternalServerError("Failed to fetch cafe");
  });

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  return cafe;
};

/**
 * =========================================================
 * SAVE CAFE
 * =========================================================
 */
export const saveCafeRepo = async (cafe: ICafe): Promise<ICafe> => {
  return cafe.save().catch(() => {
    throw new InternalServerError("Failed to save cafe");
  });
};

/**
 * =========================================================
 * SAVE USER
 * =========================================================
 */
export const saveUserRepo = async (user: IUser): Promise<IUser> => {
  return user.save().catch(() => {
    throw new InternalServerError("Failed to save user");
  });
};

// =========================================
// FIND PENDING CAFES
// =========================================
export const findPendingCafes = async (): Promise<ICafe[]> => {
  return await Cafe.find({ status: "pending" }).sort({ createdAt: -1 }).lean();
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
