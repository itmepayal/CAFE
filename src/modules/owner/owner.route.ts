import { Router } from "express";
import {
  getMyCafeController,
  updateMyCafeController,
  toggleCafeOpenController,
  createMenuItemController,
  updateMenuItemController,
  deleteMenuItemController,
  toggleMenuAvailabilityController,
} from "./owner.controller";

import { upload } from "../../config/multer.config";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

import {
  createMenuItemSchema,
  menuItemParamsSchema,
  toggleAvailabilitySchema,
  updateCafeSchema,
  updateMenuItemSchema,
} from "./owner.validation";

const ownerRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Owner
 *   description: Owner Management APIs
 */

/* =========================================================
   CAFE OWNER
========================================================= */
/**
 * @swagger
 * /owners/cafes/my-cafe:
 *   get:
 *     summary: Get logged-in cafe owner's cafe
 *     tags: [Owner]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cafe fetched successfully
 */
ownerRouter.get(
  "/cafes/my-cafe",
  authenticate,
  authorize("cafe_owner"),
  getMyCafeController,
);

/**
 * @swagger
 * /owners/cafes/my-cafe:
 *   put:
 *     summary: Update cafe details
 *     tags: [Owner]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cafeName:
 *                 type: string
 *               ownerName:
 *                 type: string
 *               description:
 *                 type: string
 *               mobile:
 *                 type: string
 *               email:
 *                 type: string
 *               street:
 *                 type: string
 *               area:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               landmark:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               aadharNumber:
 *                 type: string
 *               panNumber:
 *                 type: string
 *               fssaiNumber:
 *                 type: string
 *               accountHolderName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               ifscCode:
 *                 type: string
 *               upiId:
 *                 type: string
 *               cafeImage:
 *                 type: string
 *                 format: binary
 *               menuImage:
 *                 type: string
 *                 format: binary
 *               gallery:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               aadharPhoto:
 *                 type: string
 *                 format: binary
 *               panPhoto:
 *                 type: string
 *                 format: binary
 *               fssaiCertificate:
 *                 type: string
 *                 format: binary
 *               bankPassbookPhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cafe updated successfully
 */
ownerRouter.put(
  "/cafes/my-cafe",
  authenticate,
  authorize("cafe_owner"),
  upload.fields([
    { name: "cafeImage", maxCount: 1 },
    { name: "menuImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
    { name: "aadharPhoto", maxCount: 1 },
    { name: "panPhoto", maxCount: 1 },
    { name: "fssaiCertificate", maxCount: 1 },
    { name: "bankPassbookPhoto", maxCount: 1 },
  ]),
  validate(updateCafeSchema),
  updateMyCafeController,
);

/**
 * @swagger
 * /owners/cafes/my-cafe/toggle-open:
 *   patch:
 *     summary: Open or close cafe
 *     tags: [Owner]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cafe status updated successfully
 */
ownerRouter.patch(
  "/cafes/my-cafe/toggle-open",
  authenticate,
  authorize("cafe_owner"),
  toggleCafeOpenController,
);

/**
 * @swagger
 * /owners/menus:
 *   post:
 *     summary: Create menu item
 *     tags: [Owner]
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
ownerRouter.post(
  "/menus",
  authenticate,
  authorize("cafe_owner"),
  upload.single("image"),
  validate(createMenuItemSchema),
  createMenuItemController,
);

/**
 * @swagger
 * /owners/menus/{itemId}:
 *   put:
 *     summary: Update menu item
 *     tags: [Owner]
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
ownerRouter.put(
  "/menus/:itemId",
  authenticate,
  authorize("cafe_owner"),
  upload.single("image"),
  validate(menuItemParamsSchema),
  validate(updateMenuItemSchema),
  updateMenuItemController,
);

/**
 * @swagger
 * /owners/menus/{itemId}:
 *   delete:
 *     summary: Delete menu item
 *     tags: [Owner]
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
ownerRouter.delete(
  "/menus/:itemId",
  authenticate,
  authorize("cafe_owner"),
  validate(menuItemParamsSchema),
  deleteMenuItemController,
);

/**
 * @swagger
 * /owners/menus/{itemId}/availability:
 *   patch:
 *     summary: Toggle menu item availability
 *     tags: [Owner]
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
ownerRouter.patch(
  "/menus/:itemId/availability",
  authenticate,
  authorize("cafe_owner"),
  validate(toggleAvailabilitySchema),
  toggleMenuAvailabilityController,
);

export default ownerRouter;
