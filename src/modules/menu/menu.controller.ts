import { Request, Response, NextFunction } from "express";
import { getCafeMenuService, getMenuItemService } from "./menu.service";

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

    console.log(cafeId);

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
