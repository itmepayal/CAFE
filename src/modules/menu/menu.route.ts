import { Router } from "express";

import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

import { cafeMenuParamsSchema, menuItemParamsSchema } from "./menu.validation";

import {
  getCafeMenuController,
  getMenuItemController,
} from "./menu.controller";

const menuRouter = Router();

/**
 * @swagger
 * /menus/item/{itemId}:
 *   get:
 *     summary: Get menu item details
 *     tags: [Student Menu]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
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
// Static path MUST be registered before /:cafeId to avoid shadowing
menuRouter.get(
  "/item/:itemId",
  authenticate,
  authorize("student"),
  validate(menuItemParamsSchema),
  getMenuItemController,
);

/**
 * @swagger
 * /menus/{cafeId}:
 *   get:
 *     summary: Get cafe menu (available items only)
 *     tags: [Student Menu]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
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
  authorize("student"),
  validate(cafeMenuParamsSchema),
  getCafeMenuController,
);

export default menuRouter;
