import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

import {
  cafeMenuParamsSchema,
  createMenuItemSchema,
  menuItemParamsSchema,
  toggleAvailabilitySchema,
  updateMenuItemSchema,
} from "./menu.validation";

import {
  createMenuItemController,
  deleteMenuItemController,
  getCafeMenuController,
  getMenuItemController,
  toggleMenuAvailabilityController,
  updateMenuItemController,
} from "./menu.controller";
import { upload } from "../../config/multer.config";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Cafe Menu Management
 */

/**
 * =========================================================
 * STUDENT + CAFE OWNER
 * =========================================================
 */

/**
 * @swagger
 * /menu/{cafeId}:
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
router.get(
  "/:cafeId",
  authenticate,
  validate(cafeMenuParamsSchema),
  getCafeMenuController,
);

/**
 * @swagger
 * /menu/item/{itemId}:
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
router.get(
  "/item/:itemId",
  authenticate,
  validate(menuItemParamsSchema),
  getMenuItemController,
);

/**
 * =========================================================
 * CAFE OWNER ONLY
 * =========================================================
 */
/**
 * @swagger
 * /menu:
 *   post:
 *     summary: Create menu item
 *     tags: [Menu]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - cafeId
 *               - category
 *               - name
 *               - price
 *             properties:
 *               cafeId:
 *                 type: string
 *                 example: 6a2ebca534f3496a157dc7a5
 *               category:
 *                 type: string
 *                 example: Nasta
 *               name:
 *                 type: string
 *                 example: Veg Burger
 *               description:
 *                 type: string
 *                 example: Delicious veg burger with cheese
 *               image:
 *                 type: string
 *                 format: binary
 *               price:
 *                 type: number
 *                 example: 120
 *               discountedPrice:
 *                 type: number
 *                 example: 99
 *               preparationTime:
 *                 type: number
 *                 example: 15
 *               isVeg:
 *                 type: boolean
 *                 example: true
 *               isPopular:
 *                 type: boolean
 *                 example: true
 *               isRecommended:
 *                 type: boolean
 *                 example: true
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *               stockQuantity:
 *                 type: number
 *                 example: 100
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - burger
 *                   - fastfood
 *                   - veg
 *               displayOrder:
 *                 type: number
 *                 example: 1
 *               nutritionalInfo:
 *                 type: object
 *                 properties:
 *                   calories:
 *                     type: number
 *                   protein:
 *                     type: number
 *                   carbs:
 *                     type: number
 *                   fat:
 *                     type: number
 *     responses:
 *       201:
 *         description: Menu item created successfully
 */
router.post(
  "/",
  authenticate,
  authorize("cafe_owner"),
  upload.single("image"),
  validate(createMenuItemSchema),
  createMenuItemController,
);

/**
 * @swagger
 * /menu/{itemId}:
 *   put:
 *     summary: Update menu item
 *     tags: [Menu]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Menu item updated successfully
 */
router.put(
  "/:itemId",
  authenticate,
  authorize("cafe_owner"),
  upload.single("image"),
  validate(menuItemParamsSchema),
  validate(updateMenuItemSchema),
  updateMenuItemController,
);

/**
 * @swagger
 * /menu/{itemId}:
 *   delete:
 *     summary: Delete menu item
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
 *         description: Menu item deleted successfully
 */
router.delete(
  "/:itemId",
  authenticate,
  authorize("cafe_owner"),
  validate(menuItemParamsSchema),
  deleteMenuItemController,
);

/**
 * @swagger
 * /menu/{itemId}/availability:
 *   patch:
 *     summary: Toggle menu item availability
 *     tags: [Menu]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Availability updated successfully
 */
router.patch(
  "/:itemId/availability",
  authenticate,
  authorize("cafe_owner"),
  validate(toggleAvailabilitySchema),
  toggleMenuAvailabilityController,
);

export default router;
