import MenuItem, { type IMenuItem } from "../../models/menu";
import Cafe from "../../models/cafe";

import logger from "../../config/logger.config";
import {
  InternalServerError,
  NotFoundError,
} from "../../utils/errors/app.error";

/**
 * =========================================================
 * GET ALL MENU ITEMS BY CAFE
 * =========================================================
 */
export const getMenuItemsByCafeRepo = async (
  cafeId: string,
  options: { availableOnly?: boolean } = {},
): Promise<IMenuItem[]> => {
  try {
    const query: Record<string, unknown> = {
      cafeId,
      isDeleted: false,
    };

    if (options.availableOnly) {
      query.isAvailable = true;
    }

    return await MenuItem.find(query).sort({
      displayOrder: 1,
      createdAt: -1,
    });
  } catch (error) {
    logger.error("Failed to fetch menu items by cafe", { cafeId, error });
    throw error;
  }
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

export const findMenuItemsByIdsRepo = async (
  itemIds: string[],
): Promise<IMenuItem[]> => {
  if (itemIds.length === 0) return [];

  return MenuItem.find({
    _id: { $in: itemIds },
    isDeleted: false,
  });
};

/**
 * Atomically decrement stock when stockQuantity >= 0.
 * stockQuantity === -1 means unlimited (no-op success).
 */
export const decrementMenuStockRepo = async (
  itemId: string,
  quantity: number,
): Promise<boolean> => {
  const item = await MenuItem.findById(itemId).select("stockQuantity");
  if (!item) return false;

  if (item.stockQuantity < 0) {
    return true; // unlimited
  }

  const updated = await MenuItem.findOneAndUpdate(
    {
      _id: itemId,
      isDeleted: false,
      isAvailable: true,
      stockQuantity: { $gte: quantity },
    },
    {
      $inc: { stockQuantity: -quantity, totalOrders: quantity },
    },
    { new: true },
  );

  return Boolean(updated);
};

export const restoreMenuStockRepo = async (
  itemId: string,
  quantity: number,
): Promise<void> => {
  const item = await MenuItem.findById(itemId).select("stockQuantity");
  if (!item || item.stockQuantity < 0) return;

  await MenuItem.findByIdAndUpdate(itemId, {
    $inc: { stockQuantity: quantity },
  });
};

export const applyMenuItemRatingRepo = async (
  itemId: string,
  stars: number,
): Promise<void> => {
  const item = await MenuItem.findById(itemId).select("rating");
  if (!item) return;

  const totalReviews = (item.rating?.totalReviews ?? 0) + 1;
  const previousAverage = item.rating?.average ?? 0;
  const average =
    totalReviews === 1
      ? stars
      : (previousAverage * (totalReviews - 1) + stars) / totalReviews;

  await MenuItem.findByIdAndUpdate(itemId, {
    $set: {
      "rating.average": parseFloat(average.toFixed(2)),
      "rating.totalReviews": totalReviews,
    },
  });
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

/**
 * =========================================================
 * VERIFY CAFE EXISTS
 * =========================================================
 */
export const findCafeRepo = async (cafeId: string) => {
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
 * GET OWNER MENU ITEMS
 * =========================================================
 */
export const getOwnerMenuItemsRepo = async (
  cafeId: string,
): Promise<IMenuItem[]> => {
  return MenuItem.find({
    cafeId,
    isDeleted: false,
  })
    .populate("categoryId")
    .sort({
      createdAt: -1,
    })
    .catch(() => {
      throw new InternalServerError("Failed to fetch menu items");
    });
};

/**
 * =========================================================
 * SEARCH MENU ITEMS
 * =========================================================
 */
export const searchMenuItemsRepo = async (
  cafeId: string,
  search: string,
): Promise<IMenuItem[]> => {
  return MenuItem.find({
    cafeId,
    isDeleted: false,
    $text: {
      $search: search,
    },
  }).catch(() => {
    throw new InternalServerError("Failed to search menu items");
  });
};

/**
 * =========================================================
 * GET AVAILABLE ITEMS
 * =========================================================
 */
export const getAvailableMenuItemsRepo = async (
  cafeId: string,
): Promise<IMenuItem[]> => {
  return MenuItem.find({
    cafeId,
    isDeleted: false,
    isAvailable: true,
  }).catch(() => {
    throw new InternalServerError("Failed to fetch available items");
  });
};

/**
 * =========================================================
 * GET POPULAR ITEMS
 * =========================================================
 */
export const getPopularMenuItemsRepo = async (
  cafeId: string,
): Promise<IMenuItem[]> => {
  return MenuItem.find({
    cafeId,
    isDeleted: false,
    isPopular: true,
  })
    .sort({
      totalOrders: -1,
    })
    .catch(() => {
      throw new InternalServerError("Failed to fetch popular items");
    });
};
