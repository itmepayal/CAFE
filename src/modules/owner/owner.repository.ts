import Cafe, { ICafe } from "../../models/cafe";
import MenuItem, { IMenuItem } from "../../models/menu";
import {
  InternalServerError,
  NotFoundError,
} from "../../utils/errors/app.error";

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
  data: Partial<ICafe>,
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
