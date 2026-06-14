import { Request, Response, NextFunction } from "express";

import {
  createMenuItemService,
  deleteMenuItemService,
  getCafeMenuService,
  getMenuItemService,
  toggleMenuAvailabilityService,
  updateMenuItemService,
} from "./menu.service";
import { uploadToCloudinary } from "../../config/cloudinary.config";

/**
 * =========================================================
 * GET ALL MENU ITEMS OF A CAFE
 * =========================================================
 */
export const getCafeMenuController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { cafeId } = req.params;

    const menuItems = await getCafeMenuService(cafeId);

    res.status(200).json({
      success: true,
      count: menuItems.length,
      menuItems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * GET SINGLE MENU ITEM
 * =========================================================
 */
export const getMenuItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { itemId } = req.params;

    const menuItem = await getMenuItemService(itemId);

    res.status(200).json({
      success: true,
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * CREATE MENU ITEM
 * =========================================================
 */
export const createMenuItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let image = "";

    if (req.file) {
      image = await uploadToCloudinary(req.file.path, "menu-items");
    }

    const menuItem = await createMenuItemService(req.body.cafeId, {
      ...req.body,
      image,
    });

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * UPDATE MENU ITEM
 * =========================================================
 */
export const updateMenuItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { itemId } = req.params;

    let updateData: any = { ...req.body };

    if (req.file) {
      updateData.image = await uploadToCloudinary(req.file.path, "menu-items");
    }

    const menuItem = await updateMenuItemService(itemId, updateData);

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * DELETE MENU ITEM
 * =========================================================
 */
export const deleteMenuItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { itemId } = req.params;

    await deleteMenuItemService(itemId);

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * TOGGLE MENU AVAILABILITY
 * =========================================================
 */
export const toggleMenuAvailabilityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { itemId } = req.params;

    const menuItem = await toggleMenuAvailabilityService(itemId);

    res.status(200).json({
      success: true,
      message: menuItem.isAvailable
        ? "Menu item is now available"
        : "Menu item is now unavailable",
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};
