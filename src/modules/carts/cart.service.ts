import { logger } from "../../config/logger.config";
import MenuItem from "../../models/menu";
import { BadRequestError, NotFoundError } from "../../utils/errors/app.error";
import {
  findCartByUserId,
  createCart,
  saveCart,
  deleteCart,
} from "./cart.repository";

/**
 * =========================================================
 * ADD TO CART
 * =========================================================
 */
export const addToCartService = async (
  userId: string,
  menuItemId: string,
  quantity: number,
  specialInstructions?: string,
) => {
  logger.info(
    `Adding item ${menuItemId} (qty: ${quantity}) to cart for user ${userId}`,
  );

  const menuItem = await MenuItem.findById(menuItemId);

  if (!menuItem) {
    logger.warn(`Menu item not found: ${menuItemId}`);
    throw new NotFoundError("Menu item not found");
  }

  if (!menuItem.isAvailable) {
    logger.warn(`Menu item not available: ${menuItemId}`);
    throw new BadRequestError("Item is not available");
  }

  let cart = await findCartByUserId(userId);

  if (!cart) {
    logger.info(`No existing cart found, creating new cart for user ${userId}`);
    cart = await createCart({
      userId,
      cafeId: menuItem.cafeId.toString(),
      items: [],
    });
  }

  if (cart.cafeId.toString() !== menuItem.cafeId.toString()) {
    logger.warn(
      `User ${userId} attempted to add item from a different cafe (cart cafe: ${cart.cafeId}, item cafe: ${menuItem.cafeId})`,
    );
    throw new BadRequestError(
      "Clear existing cart before ordering from another cafe",
    );
  }

  const existingItem = cart.items.find(
    (item) => item.menuItemId.toString() === menuItemId,
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.subtotal = existingItem.quantity * existingItem.price;
    logger.info(`Updated quantity for existing cart item ${menuItemId}`);
  } else {
    cart.items.push({
      menuItemId: menuItem._id,
      itemName: menuItem.name,
      itemImage: menuItem.image,
      price: menuItem.effectivePrice,
      quantity,
      subtotal: menuItem.effectivePrice * quantity,
      specialInstructions: specialInstructions || "",
    } as any);
    logger.info(`Added new item ${menuItemId} to cart`);
  }

  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);

  return saveCart(cart);
};

/**
 * =========================================================
 * GET CART
 * =========================================================
 */
export const getCartService = async (userId: string) => {
  logger.info(`Fetching cart for user ${userId}`);

  const cart = await findCartByUserId(userId);

  if (!cart) {
    logger.info(`No cart found for user ${userId}, returning empty cart`);
    return {
      items: [],
      totalItems: 0,
      subtotal: 0,
    };
  }

  return cart;
};

/**
 * =========================================================
 * UPDATE CART ITEM
 * =========================================================
 */
export const updateCartItemService = async (
  userId: string,
  cartItemId: string,
  quantity: number,
) => {
  logger.info(
    `Updating cart item ${cartItemId} to quantity ${quantity} for user ${userId}`,
  );

  const cart = await findCartByUserId(userId);

  if (!cart) {
    logger.warn(`Cart not found for user ${userId}`);
    throw new NotFoundError("Cart not found");
  }

  const item = cart.items.find(
    (item) => (item as any)._id.toString() === cartItemId,
  );

  if (!item) {
    logger.warn(`Cart item not found: ${cartItemId}`);
    throw new NotFoundError("Cart item not found");
  }

  item.quantity = quantity;
  item.subtotal = item.quantity * item.price;
  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);
  return saveCart(cart);
};

/**
 * =========================================================
 * REMOVE CART ITEM
 * =========================================================
 */
export const removeCartItemService = async (
  userId: string,
  cartItemId: string,
) => {
  logger.info(`Removing cart item ${cartItemId} for user ${userId}`);

  const cart = await findCartByUserId(userId);

  if (!cart) {
    logger.warn(`Cart not found for user ${userId}`);
    throw new NotFoundError("Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => (item as any)._id.toString() !== cartItemId,
  );

  if (cart.items.length === 0) {
    logger.info(`Cart is now empty, deleting cart for user ${userId}`);
    await deleteCart(userId);
    return null;
  }

  cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0);

  return saveCart(cart);
};

/**
 * =========================================================
 * CLEAR CART
 * =========================================================
 */
export const clearCartService = async (userId: string) => {
  logger.info(`Clearing cart for user ${userId}`);

  await deleteCart(userId);
};
