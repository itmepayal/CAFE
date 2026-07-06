import { Router } from "express";
import {
  getMyCafeController,
  updateMyCafeController,
  toggleCafeOpenController,
  createMenuItemController,
  updateMenuItemController,
  deleteMenuItemController,
  toggleMenuAvailabilityController,
  getMyComplaintsController,
  getMyMenuItemsController,
  getMyCafeOrdersController,
  getCafeOrderDetailsController,
  updateOrderStatusController,
} from "./owner.controller";

import { upload } from "../../config/multer.config";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

import {
  createMenuItemSchema,
  getMyComplaintsSchema,
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
 * /owners/cafes/my-cafe/menus:
 *   get:
 *     summary: Get all menu items of the logged-in cafe owner
 *     description: Returns all menu items belonging to the authenticated cafe owner's cafe.
 *     tags: [Owner]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Menu items fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 685fcbbfd5d1c29f5d6a1234
 *                       cafeId:
 *                         type: string
 *                         example: 685fcbbfd5d1c29f5d6a5678
 *                       category:
 *                         type: string
 *                         example: Snacks
 *                       name:
 *                         type: string
 *                         example: Veg Burger
 *                       description:
 *                         type: string
 *                         example: Freshly prepared veg burger with cheese.
 *                       image:
 *                         type: string
 *                         example: https://res.cloudinary.com/demo/image/upload/burger.jpg
 *                       price:
 *                         type: number
 *                         example: 120
 *                       discountedPrice:
 *                         type: number
 *                         example: 99
 *                       preparationTime:
 *                         type: number
 *                         example: 15
 *                       isVeg:
 *                         type: boolean
 *                         example: true
 *                       isAvailable:
 *                         type: boolean
 *                         example: true
 *                       isPopular:
 *                         type: boolean
 *                         example: false
 *                       isRecommended:
 *                         type: boolean
 *                         example: true
 *                       stockQuantity:
 *                         type: number
 *                         example: 50
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example:
 *                           - burger
 *                           - fastfood
 *                       displayOrder:
 *                         type: number
 *                         example: 1
 *                       nutritionalInfo:
 *                         type: object
 *                         properties:
 *                           calories:
 *                             type: number
 *                             example: 320
 *                           protein:
 *                             type: number
 *                             example: 12
 *                           carbs:
 *                             type: number
 *                             example: 28
 *                           fat:
 *                             type: number
 *                             example: 15
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cafe not found
 */
ownerRouter.get(
  "/cafes/my-cafe/menus",
  authenticate,
  authorize("cafe_owner"),
  getMyMenuItemsController,
);

/**
 * @swagger
 * /owners/cafes/my-cafe/menus:
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
  "/cafes/my-cafe/menus",
  authenticate,
  authorize("cafe_owner"),
  upload.single("image"),
  validate(createMenuItemSchema),
  createMenuItemController,
);

/**
 * @swagger
 * /owners/cafes/my-cafe/menus/{itemId}:
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
  "/cafes/my-cafe/menus/:itemId",
  authenticate,
  authorize("cafe_owner"),
  upload.single("image"),
  validate(menuItemParamsSchema),
  validate(updateMenuItemSchema),
  updateMenuItemController,
);

/**
 * @swagger
 * /owners/cafes/my-cafe/menus/{itemId}:
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
  "/cafes/my-cafe/menus/:itemId",
  authenticate,
  authorize("cafe_owner"),
  validate(menuItemParamsSchema),
  deleteMenuItemController,
);

/**
 * @swagger
 * /owners/cafes/my-cafe/menus/{itemId}/availability/toggle:
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
  "/cafes/my-cafe/menus/:itemId/availability/toggle",
  authenticate,
  authorize("cafe_owner"),
  validate(toggleAvailabilitySchema),
  toggleMenuAvailabilityController,
);

/**
 * @swagger
 * /owners/cafes/my-cafe/orders:
 *   get:
 *     summary: Get all orders for the logged-in cafe owner
 *     description: Returns all orders belonging to the authenticated owner's cafe. Optionally filter by order status.
 *     tags: [Owner]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - accepted
 *             - rejected
 *             - preparing
 *             - ready
 *             - completed
 *             - cancelled
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cafe not found
 */
ownerRouter.get(
  "/cafes/my-cafe/orders",
  authenticate,
  authorize("cafe_owner"),
  getMyCafeOrdersController,
);

/**
 * @swagger
 * /owners/cafes/my-cafe/orders/{orderId}:
 *   get:
 *     summary: Get order details
 *     description: Get a single order belonging to the logged-in owner's cafe.
 *     tags: [Owner]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order fetched successfully
 *       404:
 *         description: Order not found
 */
ownerRouter.get(
  "/cafes/my-cafe/orders/:orderId",
  authenticate,
  authorize("cafe_owner"),
  getCafeOrderDetailsController,
);

/**
 * @swagger
 * /owners/cafes/my-cafe/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status
 *     description: Update the status of an order belonging to the logged-in owner's cafe.
 *     tags: [Owner]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - accepted
 *                   - rejected
 *                   - preparing
 *                   - ready
 *                   - completed
 *                   - cancelled
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status update
 *       404:
 *         description: Order not found
 */
ownerRouter.patch(
  "/cafes/my-cafe/orders/:orderId/status",
  authenticate,
  authorize("cafe_owner"),
  updateOrderStatusController,
);

/**
 * @swagger
 * /owners/cafes/my-cafe/complaints:
 *   get:
 *     summary: Get logged-in user's complaints
 *     tags: [Owner]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - open
 *             - in_review
 *             - resolved
 *             - rejected
 *             - closed
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum:
 *             - food_quality
 *             - wrong_item
 *             - late_order
 *             - refund_issue
 *             - payment_issue
 *             - cafe_behavior
 *             - technical_issue
 *             - other
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Complaints fetched successfully
 */
ownerRouter.get(
  "/cafes/my-cafe/complaints",
  authenticate,
  validate(getMyComplaintsSchema),
  getMyComplaintsController,
);

export default ownerRouter;
