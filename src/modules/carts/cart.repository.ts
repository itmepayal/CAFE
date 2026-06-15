import Cart, { ICart } from "../../models/cart";

import {
  InternalServerError,
  NotFoundError,
} from "../../utils/errors/app.error";

/**
 * =========================================================
 * FIND CART BY USER ID
 * =========================================================
 */
export const findCartByUserId = async (
  userId: string,
): Promise<ICart | null> => {
  return Cart.findOne({ userId })
    .populate("items.menuItemId")
    .populate("cafeId")
    .catch(() => {
      throw new InternalServerError("Failed to fetch cart");
    });
};

/**
 * =========================================================
 * FIND CART BY ID
 * =========================================================
 */
export const findCartById = async (cartId: string): Promise<ICart> => {
  const cart = await Cart.findById(cartId).catch(() => {
    throw new InternalServerError("Failed to fetch cart");
  });

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  return cart;
};

/**
 * =========================================================
 * CREATE CART
 * =========================================================
 */
export const createCart = async (payload: Partial<ICart>): Promise<ICart> => {
  return Cart.create(payload).catch(() => {
    throw new InternalServerError("Failed to create cart");
  });
};

/**
 * =========================================================
 * SAVE CART
 * =========================================================
 */
export const saveCart = async (cart: ICart): Promise<ICart> => {
  return cart.save().catch(() => {
    throw new InternalServerError("Failed to save cart");
  });
};

/**
 * =========================================================
 * DELETE CART
 * =========================================================
 */
export const deleteCart = async (userId: string): Promise<void> => {
  await Cart.findOneAndDelete({ userId }).catch(() => {
    throw new InternalServerError("Failed to delete cart");
  });
};

/**
 * =========================================================
 * REMOVE CART ITEM
 * =========================================================
 */
export const removeCartItem = async (
  cartId: string,
  cartItemId: string,
): Promise<ICart> => {
  const cart = await findCartById(cartId);

  cart.items = cart.items.filter(
    (item) => (item as any)._id?.toString() !== cartItemId,
  );

  return saveCart(cart);
};

/**
 * =========================================================
 * FIND CART BY USER & CAFE
 * =========================================================
 */
export const findCartByUserAndCafe = async (
  userId: string,
  cafeId: string,
): Promise<ICart | null> => {
  return Cart.findOne({
    userId,
    cafeId,
  }).catch(() => {
    throw new InternalServerError("Failed to fetch cart");
  });
};
