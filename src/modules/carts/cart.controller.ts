import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../utils/response/app.response";

import {
  addToCartService,
  getCartService,
  updateCartItemService,
  removeCartItemService,
  clearCartService,
} from "./cart.service";

/**
 * =========================================================
 * ADD TO CART
 * =========================================================
 */
export const addToCartController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    const cart = await addToCartService(
      userId,
      req.body.menuItemId,
      req.body.quantity,
      req.body.specialInstructions,
    );

    ApiResponse.success(res, "Item added to cart", cart, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * GET CART
 * =========================================================
 */
export const getCartController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cart = await getCartService(req.user!.id);
    ApiResponse.success(res, "Cart fetched", cart);
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * UPDATE CART ITEM
 * =========================================================
 */
export const updateCartItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cart = await updateCartItemService(
      req.user!.id,
      req.params.cartItemId,
      req.body.quantity,
    );

    ApiResponse.success(res, "Cart updated successfully", cart);
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * REMOVE CART ITEM
 * =========================================================
 */
export const removeCartItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await removeCartItemService(req.user!.id, req.params.cartItemId);
    ApiResponse.success(res, "Item removed from cart");
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * CLEAR CART
 * =========================================================
 */
export const clearCartController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await clearCartService(req.user!.id);
    ApiResponse.success(res, "Cart cleared successfully");
  } catch (error) {
    next(error);
  }
};
