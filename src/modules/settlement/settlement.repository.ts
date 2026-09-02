import Settlement, { ISettlement, SettlementStatus } from "../../models/settlement";
import Order from "../../models/order";
import mongoose from "mongoose";
import { logger } from "../../config/logger.config";

export interface OwnerTransactionFilters {
  from?: string;
  to?: string;
  settlementStatus?: SettlementStatus;
  page?: number;
  limit?: number;
}

export const createSettlementForOrder = async (order: {
  _id: mongoose.Types.ObjectId;
  cafeId: mongoose.Types.ObjectId | string;
  orderNumber: string;
  totalAmount: number;
  paymentStatus: string;
  status: string;
}): Promise<ISettlement | null> => {
  if (order.status !== "completed" || order.paymentStatus !== "paid") {
    return null;
  }

  const existing = await Settlement.findOne({
    orderId: order._id,
  });
  if (existing) {
    return existing;
  }

  const settlement = await Settlement.create({
    orderId: order._id,
    cafeId: order.cafeId,
    orderNumber: order.orderNumber,
    amount: order.totalAmount,
    status: "pending",
  });

  logger.info("Settlement created for completed order", {
    orderId: order._id.toString(),
    settlementId: settlement._id.toString(),
  });

  return settlement;
};

export const findOwnerTransactions = async (
  cafeId: string,
  filters: OwnerTransactionFilters = {},
) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const toDate = filters.to ? new Date(filters.to) : new Date();
  const fromDate = filters.from
    ? new Date(filters.from)
    : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  toDate.setHours(23, 59, 59, 999);
  fromDate.setHours(0, 0, 0, 0);

  const cafeObjectId = new mongoose.Types.ObjectId(cafeId);

  const baseMatch: Record<string, unknown> = {
    cafeId: cafeObjectId,
    status: "completed",
    paymentStatus: "paid",
    createdAt: { $gte: fromDate, $lte: toDate },
  };

  const pipeline: mongoose.PipelineStage[] = [
    { $match: baseMatch },
    {
      $lookup: {
        from: "settlements",
        localField: "_id",
        foreignField: "orderId",
        as: "settlement",
      },
    },
    {
      $addFields: {
        settlementStatus: {
          $ifNull: [{ $arrayElemAt: ["$settlement.status", 0] }, "pending"],
        },
        settledAt: { $arrayElemAt: ["$settlement.settledAt", 0] },
      },
    },
  ];

  if (filters.settlementStatus) {
    pipeline.push({ $match: { settlementStatus: filters.settlementStatus } });
  }

  const skip = (page - 1) * limit;

  const [result] = await Order.aggregate([
    ...pipeline,
    {
      $facet: {
        transactions: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "users",
              localField: "studentId",
              foreignField: "_id",
              as: "student",
            },
          },
          {
            $project: {
              orderId: "$_id",
              orderNumber: 1,
              customerName: {
                $ifNull: [{ $arrayElemAt: ["$student.name", 0] }, "Customer"],
              },
              customerEmail: {
                $ifNull: [{ $arrayElemAt: ["$student.email", 0] }, ""],
              },
              amount: "$totalAmount",
              paymentMethod: 1,
              paymentStatus: 1,
              settlementStatus: 1,
              settledAt: 1,
              createdAt: 1,
            },
          },
        ],
        total: [{ $count: "count" }],
        summary: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$totalAmount" },
              settledAmount: {
                $sum: {
                  $cond: [
                    { $eq: ["$settlementStatus", "settled"] },
                    "$totalAmount",
                    0,
                  ],
                },
              },
              pendingAmount: {
                $sum: {
                  $cond: [
                    { $eq: ["$settlementStatus", "pending"] },
                    "$totalAmount",
                    0,
                  ],
                },
              },
            },
          },
        ],
      },
    },
  ]);

  const summary = result?.summary?.[0] ?? {
    totalAmount: 0,
    settledAmount: 0,
    pendingAmount: 0,
  };

  const total = result?.total?.[0]?.count ?? 0;

  return {
    summary: {
      totalAmount: summary.totalAmount,
      settledAmount: summary.settledAmount,
      pendingAmount: summary.pendingAmount,
      from: fromDate,
      to: toDate,
    },
    transactions: result?.transactions ?? [],
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

export const settleById = async (
  settlementId: string,
  adminId: string,
): Promise<ISettlement> => {
  const settlement = await Settlement.findByIdAndUpdate(
    settlementId,
    {
      status: "settled",
      settledAt: new Date(),
      settledBy: adminId,
    },
    { new: true },
  );

  if (!settlement) {
    throw new Error("Settlement not found");
  }

  return settlement;
};

export const settlePendingOlderThan = async (
  days: number,
): Promise<number> => {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Settlement.updateMany(
    {
      status: "pending",
      createdAt: { $lte: cutoff },
    },
    {
      $set: {
        status: "settled",
        settledAt: new Date(),
      },
    },
  );

  return result.modifiedCount;
};

export const findSettlementsForAdmin = async (
  filters: {
    cafeId?: string;
    status?: SettlementStatus;
    page?: number;
    limit?: number;
  } = {},
) => {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const query: Record<string, unknown> = {};

  if (filters.cafeId) {
    query.cafeId = filters.cafeId;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const skip = (page - 1) * limit;

  const [settlements, total] = await Promise.all([
    Settlement.find(query)
      .populate("orderId", "orderNumber totalAmount")
      .populate("cafeId", "cafeName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Settlement.countDocuments(query),
  ]);

  return { settlements, total, page, limit, pages: Math.ceil(total / limit) };
};
