import User, { IUser } from "../../models/user";
import Cafe, { ICafe } from "../../models/cafe";

import {
  InternalServerError,
  NotFoundError,
} from "../../utils/errors/app.error";
import Complaint, { IComplaint } from "../../models/complaint";
import Order from "../../models/order";
import { OrderStatus } from "../order/order.constant";

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
  return await Cafe.find({ status: "pending" })
    .populate("userId", "name email phone")
    .sort({ createdAt: -1 })
    .lean();
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
      .populate("cafeId", "cafeName")
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
    .populate("cafeId", "cafeName")
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

// =========================================
// ADMIN DASHBOARD STATS
// =========================================
export const getDashboardStatsRepo = async () => {
  const activeOrderStatuses: OrderStatus[] = [
    "pending",
    "accepted",
    "preparing",
    "ready",
    "out_for_delivery",
  ];

  const [
    totalOrders,
    activeOrders,
    totalRevenueAgg,
    totalUsers,
    activeCafes,
    openCafes,
    totalCafes,
    pendingCafeRequests,
    statusCounts,
    todayOrders,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: { $in: activeOrderStatuses } }),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    User.countDocuments({ isActive: true, isBlocked: false }),
    Cafe.countDocuments({ status: "approved", isBlocked: false }),
    Cafe.countDocuments({
      status: "approved",
      isOpen: true,
      isBlocked: false,
      isVisible: true,
    }),
    Cafe.countDocuments({ status: "approved", isVisible: true, isBlocked: false }),
    Cafe.countDocuments({ status: "pending" }),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  const totalEarnings = totalRevenueAgg[0]?.total || 0;

  return {
    totalEarnings,
    totalCollection: totalEarnings,
    activeOrders,
    totalOrders,
    totalUsers,
    activeCafes,
    openCafes,
    totalCafes,
    pendingCafeRequests,
    allUsersCount: totalUsers,
    allOrdersCount: totalOrders,
    todayOrders,
    orderStatusCounts: statusCounts,
  };
};

// =========================================
// ADMIN PAYMENTS
// =========================================
export const getPaymentsRepo = async (
  paymentStatus?: string,
  page: number = 1,
  limit: number = 10,
) => {
  const query: Record<string, unknown> = {
    paymentMethod: { $ne: "cash" },
  };

  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  const skip = (page - 1) * limit;

  const [orders, total, summaryAgg] = await Promise.all([
    Order.find(query)
      .populate("studentId", "name email")
      .populate("cafeId", "cafeName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(query),
    Order.aggregate([
      { $match: { paymentMethod: { $ne: "cash" } } },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          amount: { $sum: "$totalAmount" },
        },
      },
    ]),
  ]);

  const summary = {
    totalCollection: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
  };

  for (const row of summaryAgg) {
    if (row._id === "paid") {
      summary.successCount = row.count;
      summary.totalCollection = row.amount;
    } else if (row._id === "pending") {
      summary.pendingCount = row.count;
    } else if (row._id === "failed") {
      summary.failedCount = row.count;
    } else if (row._id === "refunded") {
      summary.refundedCount = row.count;
    }
  }

  const transactions = orders.map((order: any) => ({
    orderId: order._id,
    orderNumber: order.orderNumber,
    paymentId: order.paymentId || order.orderNumber,
    userName: order.studentId?.name || "",
    userEmail: order.studentId?.email || "",
    cafeName: order.cafeId?.cafeName || "",
    paymentMethod: order.paymentMethod,
    amount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
  }));

  return { summary, transactions, total, page, limit };
};

// =========================================
// ADMIN — ALL CAFES
// =========================================
export const findAllCafesRepo = async (
  filters: {
    status?: string;
    search?: string;
    isBlocked?: boolean;
    isVisible?: boolean;
  },
  page: number,
  limit: number,
) => {
  const query: Record<string, unknown> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.isBlocked !== undefined) {
    query.isBlocked = filters.isBlocked;
  }

  if (filters.isVisible !== undefined) {
    query.isVisible = filters.isVisible;
  }

  if (filters.search) {
    query.$or = [
      { cafeName: { $regex: filters.search, $options: "i" } },
      { ownerName: { $regex: filters.search, $options: "i" } },
      { mobile: { $regex: filters.search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [cafes, total] = await Promise.all([
    Cafe.find(query)
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Cafe.countDocuments(query),
  ]);

  return { cafes, total, page, limit };
};

// =========================================
// ADMIN — CAFE BY ID (with owner)
// =========================================
export const findCafeByIdForAdminRepo = async (cafeId: string) => {
  const cafe = await Cafe.findById(cafeId)
    .populate("userId", "name email phone role profileImage")
    .populate("approvedBy", "name email")
    .lean();

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  return cafe;
};
