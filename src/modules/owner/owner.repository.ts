import Cafe, { ICafe } from "../../models/cafe";
import Complaint, { IComplaint } from "../../models/complaint";
import MenuItem, { IMenuItem } from "../../models/menu";
import Order from "../../models/order";
import {
  InternalServerError,
  NotFoundError,
} from "../../utils/errors/app.error";
import { FindOrdersOptions } from "./owner.type";

// =========================================
// FIND APPROVED CAFES
// =========================================
export const findApprovedCafes = async (
  search?: string,
  city?: string,
  page: number = 1,
  limit: number = 10,
): Promise<{ cafes: ICafe[]; total: number; page: number; limit: number }> => {
  const filter: any = {
    status: "approved",
    isBlocked: false,
  };

  if (search) {
    filter.cafeName = { $regex: search, $options: "i" };
  }

  if (city) {
    filter["address.city"] = { $regex: city, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const [cafes, total] = await Promise.all([
    Cafe.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Cafe.countDocuments(filter),
  ]);

  return { cafes, total, page, limit };
};

// =========================================
// FIND CAFE BY USER ID
// =========================================
export const findCafeByUserId = async (
  userId: string,
): Promise<ICafe | null> => {
  return await Cafe.findOne({ userId });
};

// =========================================
// UPDATE CAFE BY USER ID
// =========================================
export const updateCafeByUserId = async (
  userId: string,
  data: Record<string, any>,
): Promise<ICafe | null> => {
  return await Cafe.findOneAndUpdate({ userId }, { $set: data }, { new: true });
};

// =========================================
// TOGGLE OPEN / CLOSE
// =========================================
export const toggleCafeOpen = async (userId: string): Promise<ICafe | null> => {
  const cafe = await Cafe.findOne({ userId });
  if (!cafe) return null;
  cafe.isOpen = !cafe.isOpen;
  return await cafe.save();
};

/**
 * =========================================================
 * FIND MENU ITEM
 * =========================================================
 */
export const findMenuItemByIdRepo = async (
  itemId: string,
): Promise<IMenuItem> => {
  const item = await MenuItem.findOne({
    _id: itemId,
    isDeleted: false,
  }).catch(() => {
    throw new InternalServerError("Failed to fetch menu item");
  });

  if (!item) {
    throw new NotFoundError("Menu item not found");
  }

  return item;
};

/**
 * =========================================================
 * CREATE MENU ITEM
 * =========================================================
 */
export const createMenuItemRepo = async (
  payload: Partial<IMenuItem>,
): Promise<IMenuItem> => {
  return MenuItem.create(payload).catch(() => {
    throw new InternalServerError("Failed to create menu item");
  });
};

/**
 * =========================================================
 * SAVE MENU ITEM
 * =========================================================
 */
export const saveMenuItemRepo = async (item: IMenuItem): Promise<IMenuItem> => {
  return item.save().catch(() => {
    throw new InternalServerError("Failed to save menu item");
  });
};

/**
 * =========================================================
 * GET ALL MENU ITEM
 * =========================================================
 */
export const findMenuItemsByCafeId = async (cafeId: string) => {
  return await MenuItem.find({
    cafeId,
    isDeleted: false,
  }).sort({ createdAt: -1 });
};

/**
 * =========================================================
 * UPDATE MENU ITEM
 * =========================================================
 */
export const updateMenuItemRepo = async (
  itemId: string,
  payload: Partial<IMenuItem>,
): Promise<IMenuItem> => {
  const item = await MenuItem.findOneAndUpdate(
    {
      _id: itemId,
      isDeleted: false,
    },
    payload,
    {
      new: true,
      runValidators: true,
    },
  ).catch(() => {
    throw new InternalServerError("Failed to update menu item");
  });

  if (!item) {
    throw new NotFoundError("Menu item not found");
  }

  return item;
};

/**
 * =========================================================
 * DELETE MENU ITEM (SOFT DELETE)
 * =========================================================
 */
export const deleteMenuItemRepo = async (
  itemId: string,
): Promise<IMenuItem> => {
  const item = await MenuItem.findOneAndUpdate(
    {
      _id: itemId,
      isDeleted: false,
    },
    {
      isDeleted: true,
    },
    {
      new: true,
    },
  ).catch(() => {
    throw new InternalServerError("Failed to delete menu item");
  });

  if (!item) {
    throw new NotFoundError("Menu item not found");
  }

  return item;
};

/**
 * =========================================================
 * TOGGLE AVAILABILITY
 * =========================================================
 */
export const toggleMenuAvailabilityRepo = async (
  itemId: string,
): Promise<IMenuItem> => {
  const item = await findMenuItemByIdRepo(itemId);

  item.isAvailable = !item.isAvailable;

  return saveMenuItemRepo(item);
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
// FIND ORDERS BY CAFE ID
// =========================================
export const findOrdersByCafeId = async (
  cafeId: string,
  options: FindOrdersOptions,
) => {
  const {
    status,
    paymentStatus,
    search,
    from,
    to,
    today,
    page = 1,
    limit = 20,
    sort = "createdAt",
    order = "desc",
  } = options;

  const filter: any = {
    cafeId,
  };

  if (status) {
    filter.status = status;
  }

  if (paymentStatus) {
    filter["payment.status"] = paymentStatus;
  }

  if (search) {
    filter.orderNumber = { $regex: search, $options: "i" };
  }

  if (today) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    filter.createdAt = {
      $gte: start,
      $lte: end,
    };
  } else if (from || to) {
    filter.createdAt = {};

    if (from) {
      filter.createdAt.$gte = new Date(from);
    }

    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      filter.createdAt.$lte = end;
    }
  }

  const total = await Order.countDocuments(filter);

  const orders = await Order.find(filter)
    .populate("studentId", "name email phone")
    .sort({
      [sort]: order === "asc" ? 1 : -1,
    })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    success: true,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    data: orders,
  };
};

// =========================================
// FIND ORDER BY CAFE ID AND ORDER ID
// =========================================
export const findOrderByCafeIdAndOrderId = async (
  cafeId: string,
  orderId: string,
) => {
  return Order.findOne({
    _id: orderId,
    cafeId,
  }).populate("studentId", "name email avatar");
};

// =========================================
// UPDATE ORDER STATUS
// =========================================
export const updateOrderStatusRepo = async (
  orderId: string,
  cafeId: string,
  status: string,
) => {
  return Order.findOneAndUpdate(
    {
      _id: orderId,
      cafeId,
    },
    {
      status,
    },
    {
      new: true,
    },
  );
};

// =========================================
// EXPIRED PENDING ORDERS
// =========================================
export const findExpiredPendingOrders = async (cutoffDate: Date) => {
  return Order.find({
    status: "pending",
    createdAt: { $lte: cutoffDate },
  });
};
