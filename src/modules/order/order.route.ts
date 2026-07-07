import { Router } from "express";

import {
  createOrderController,
  getMyOrdersController,
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
 * @swagger
 * /orders/{orderId}/cancellation:
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
  "/:orderId/cancellation",
  authenticate,
  authorize("student"),
  cancelOrderController,
);

export default orderRouter;
