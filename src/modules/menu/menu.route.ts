import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

import { cafeMenuParamsSchema, menuItemParamsSchema } from "./menu.validation";

import {
  getCafeMenuController,
  getMenuItemController,
} from "./menu.controller";

const menuRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Cafe Menu Management
 */

/**
 * @swagger
 * /menus/{cafeId}:
 *   get:
 *     summary: Get all menu items of a cafe
 *     tags: [Menu]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: cafeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cafe menu fetched successfully
 */
menuRouter.get(
  "/:cafeId",
  authenticate,
  validate(cafeMenuParamsSchema),
  getCafeMenuController,
);

/**
 * @swagger
 * /menus/item/{itemId}:
 *   get:
 *     summary: Get menu item details
 *     tags: [Menu]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Menu item fetched successfully
 */
menuRouter.get(
  "/item/:itemId",
  authenticate,
  validate(menuItemParamsSchema),
  getMenuItemController,
);

export default menuRouter;
