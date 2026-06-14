import MenuItem, { type IMenuItem } from "../../models/menu";
import Cafe from "../../models/cafe";

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
): Promise<IMenuItem[]> => {
  return MenuItem.find({
    cafeId,
    isDeleted: false,
  })
    .populate("categoryId")
    .sort({
      displayOrder: 1,
      createdAt: -1,
    })
    .catch(() => {
      throw new InternalServerError("Failed to fetch menu items");
    });
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
