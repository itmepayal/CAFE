import { Router } from "express";

import {
  createOrderController,
  getOrderByIdController,
  getMyOrdersController,
  getCafeOrdersController,
  updateOrderStatusController,
  cancelOrderController,
  rateOrderController,
} from "./order.controller";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/auth.middleware";

const orderRouter = Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cafeId
 *               - items
 *             properties:
 *               cafeId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               paymentMethod:
 *                 type: string
 *                 example: online
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 */
orderRouter.post(
  "/",
  authenticate,
  authorize("student"),
  createOrderController,
);

/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     summary: Get logged-in student's orders
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Orders fetched successfully
 */
orderRouter.get(
  "/my-orders",
  authenticate,
  authorize("student"),
  getMyOrdersController,
);

/**
 * @swagger
 * /orders/{orderId}/rate:
 *   post:
 *     summary: Rate a completed order
 *     tags: [Orders]
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
 *               - stars
 *             properties:
 *               stars:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               review:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order rated successfully
 */
orderRouter.post(
  "/:orderId/rate",
  authenticate,
  authorize("student"),
  rateOrderController,
);

/**
 * =========================================================
 * CAFE OWNER ROUTES
 * =========================================================
 */

/**
 * @swagger
 * /orders/cafe:
 *   get:
 *     summary: Get cafe orders
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
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
 *         description: Cafe orders fetched successfully
 */
orderRouter.get(
  "/cafe",
  authenticate,
  authorize("cafe_owner"),
  getCafeOrdersController,
);

/**
 * @swagger
 * /orders/{orderId}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
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
 *               estimatedReadyTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
orderRouter.patch(
  "/:orderId/status",
  authenticate,
  authorize("cafe_owner"),
  updateOrderStatusController,
);

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
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
 */
orderRouter.get(
  "/:orderId",
  authenticate,
  authorize("super_admin"),
  getOrderByIdController,
);

/**
 * @swagger
 * /orders/{orderId}/cancel:
 *   patch:
 *     summary: Cancel order
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Customer requested cancellation
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
orderRouter.patch(
  "/:orderId/cancel",
  authenticate,
  authorize("super_admin"),
  cancelOrderController,
);

export default orderRouter;
