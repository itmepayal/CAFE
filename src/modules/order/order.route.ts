import { Router } from "express";

import {
  createOrderController,
  getMyOrdersController,
  cancelOrderController,
  rateOrderController,
} from "./order.controller";

import { authenticate, authorize } from "../../middlewares/auth.middleware";

const orderRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Student order management APIs
 */

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
 *               - paymentMethod
 *             properties:
 *               cafeId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menuItemId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     specialInstructions:
 *                       type: string
 *               paymentMethod:
 *                 type: string
 *                 example: upi
 *               orderType:
 *                 type: string
 *                 enum: [pickup, delivery]
 *                 default: pickup
 *               notes:
 *                 type: string
 *               deliveryAddress:
 *                 type: object
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
 * @swagger
 * /orders/{orderId}/cancellation:
 *   patch:
 *     summary: Cancel an order
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Ordered by mistake
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */
orderRouter.patch(
  "/:orderId/cancellation",
  authenticate,
  authorize("student"),
  cancelOrderController,
);

export default orderRouter;
