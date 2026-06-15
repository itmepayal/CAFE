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
  const menuItem = await MenuItem.findById(menuItemId);

  if (!menuItem) {
    throw new NotFoundError("Menu item not found");
  }

  if (!menuItem.isAvailable) {
    throw new BadRequestError("Item is not available");
  }

  let cart = await findCartByUserId(userId);

  if (!cart) {
    cart = await createCart({
      userId,
      cafeId: menuItem.cafeId.toString(),
      items: [],
    });
  }

  if (cart.cafeId.toString() !== menuItem.cafeId.toString()) {
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
  const cart = await findCartByUserId(userId);

  if (!cart) {
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
  const cart = await findCartByUserId(userId);

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  const item = cart.items.find(
    (item) => (item as any)._id.toString() === cartItemId,
  );

  if (!item) {
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
  const cart = await findCartByUserId(userId);

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => (item as any)._id.toString() !== cartItemId,
  );

  if (cart.items.length === 0) {
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
  await deleteCart(userId);
};
