import User, { IUser } from "../../models/user";
import Cafe, { ICafe } from "../../models/cafe";

import {
  InternalServerError,
  NotFoundError,
} from "../../utils/errors/app.error";
import Complaint, { IComplaint } from "../../models/complaint";
import Order from "../../models/order";

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

// =========================================
// GET ALL ORDERS
// =========================================
export const findAllOrdersRepo = async (
  filters: {
    status?: string;
    paymentStatus?: string;
    orderType?: string;
    cafeId?: string;
    studentId?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  page: number,
  limit: number,
) => {
  const query: Record<string, any> = {};

  if (filters.status) query.status = filters.status;
  if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters.orderType) query.orderType = filters.orderType;
  if (filters.cafeId) query.cafeId = filters.cafeId;
  if (filters.studentId) query.studentId = filters.studentId;

  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("studentId", "name email")
      .populate("cafeId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query),
  ]);

  return { orders, total };
};

// =========================================
// GET ORDER BY ID
// =========================================
export const findOrderByIdRepo = async (orderId: string) => {
  return Order.findById(orderId)
    .populate("studentId", "name email phone")
    .populate("cafeId", "name")
    .populate("deliveryPersonId", "name phone");
};

// =========================================
// SAVE ORDER
// =========================================
export const saveOrderRepo = async (order: any) => {
  return order.save();
};

// =========================================
// GET ORDER BY STATS
// =========================================
export const getOrderStatsRepo = async () => {
  const [statusCounts, revenueAgg, todayCount] = await Promise.all([
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]),
    Order.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  return {
    statusCounts,
    totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    todayOrders: todayCount,
    totalOrders: await Order.countDocuments(),
  };
};
