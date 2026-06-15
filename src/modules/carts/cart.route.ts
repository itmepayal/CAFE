import { Router } from "express";

import {
  addToCartController,
  getCartController,
  updateCartItemController,
  removeCartItemController,
  clearCartController,
} from "./cart.controller";

import { authenticate } from "../../middlewares/auth.middleware";

const cartRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping Cart APIs
 */

/**
 * @swagger
 * /carts:
 *   post:
 *     summary: Add item to cart
 *     description: Add a menu item to the authenticated user's cart.
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - menuItemId
 *               - quantity
 *             properties:
 *               menuItemId:
 *                 type: string
 *                 example: 685123456789abcdef123456
 *               quantity:
 *                 type: integer
 *                 example: 2
 *               specialInstructions:
 *                 type: string
 *                 example: Extra cheese please
 *     responses:
 *       201:
 *         description: Item added to cart successfully
 *       401:
 *         description: Unauthorized
 */
cartRouter.post("/", authenticate, addToCartController);

/**
 * @swagger
 * /carts:
 *   get:
 *     summary: Get cart
 *     description: Retrieve the authenticated user's cart.
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cart fetched successfully
 *       401:
 *         description: Unauthorized
 */
cartRouter.get("/", authenticate, getCartController);

/**
 * @swagger
 * /carts/{cartItemId}:
 *   patch:
 *     summary: Update cart item quantity
 *     description: Update quantity of a cart item.
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *       404:
 *         description: Cart item not found
 */
cartRouter.patch("/:cartItemId", authenticate, updateCartItemController);

/**
 * @swagger
 * /carts/{cartItemId}:
 *   delete:
 *     summary: Remove item from cart
 *     description: Remove a specific item from the cart.
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart Item ID
 *     responses:
 *       200:
 *         description: Item removed successfully
 *       404:
 *         description: Cart item not found
 */
cartRouter.delete("/:cartItemId", authenticate, removeCartItemController);

/**
 * @swagger
 * /carts:
 *   delete:
 *     summary: Clear cart
 *     description: Remove all items from the authenticated user's cart.
 *     tags: [Cart]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401:
 *         description: Unauthorized
 */
cartRouter.delete("/", authenticate, clearCartController);

export default cartRouter;
