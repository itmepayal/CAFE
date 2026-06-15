import { Request, Response, NextFunction } from "express";

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

    res.status(201).json({
      success: true,
      message: "Item added to cart",
      data: cart,
    });
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

    res.status(200).json({
      success: true,
      data: cart,
    });
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

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: cart,
    });
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

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
    });
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

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};
