import express, { Router } from "express";
import {
  createOrderController,
  getMyOrdersController,
  getOrderByNumberController,
  verifyOrderPaymentController,
  cancelOrderController,
  rateOrderController,
  handleCashfreeWebhookController,
} from "./order.controller";

import { authenticate, authorize } from "../../middlewares/auth.middleware";

const orderRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Student Order Management APIs
 *
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
 *
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         menuItemId:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *         itemName:
 *           type: string
 *           example: Veg Cheese Sandwich
 *         itemImage:
 *           type: string
 *           example: https://cdn.example.com/menu/sandwich.jpg
 *         itemPrice:
 *           type: number
 *           example: 89
 *         quantity:
 *           type: integer
 *           example: 2
 *         subtotal:
 *           type: number
 *           example: 178
 *         specialInstructions:
 *           type: string
 *           example: Less spicy
 *
 *     DeliveryAddress:
 *       type: object
 *       properties:
 *         fullAddress:
 *           type: string
 *           example: Hostel Block C, Room 204, XYZ University
 *         contactNumber:
 *           type: string
 *           example: "9876543210"
 *         landmark:
 *           type: string
 *           example: Near main gate
 *
 *     Order:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d1
 *         orderNumber:
 *           type: string
 *           example: ORD-20260804-0001
 *         studentId:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d2
 *         cafeId:
 *           type: string
 *           example: 64f1a2b3c4d5e6f7a8b9c0d3
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         orderType:
 *           type: string
 *           enum: [pickup, delivery]
 *           example: pickup
 *         deliveryAddress:
 *           $ref: '#/components/schemas/DeliveryAddress'
 *         subtotal:
 *           type: number
 *           example: 178
 *         taxAmount:
 *           type: number
 *           example: 8.9
 *         deliveryCharge:
 *           type: number
 *           example: 0
 *         discountAmount:
 *           type: number
 *           example: 0
 *         totalAmount:
 *           type: number
 *           example: 186.9
 *         paymentMethod:
 *           type: string
 *           enum: [cash, online]
 *           example: online
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *           example: pending
 *         status:
 *           type: string
 *           enum: [pending, accepted, preparing, out_for_delivery, completed, cancelled, rejected]
 *           example: pending
 *         pickupCode:
 *           type: string
 *           example: "4821"
 *         notes:
 *           type: string
 *           example: Please pack cutlery
 *         rating:
 *           type: object
 *           properties:
 *             stars:
 *               type: integer
 *               example: 5
 *             review:
 *               type: string
 *               example: Great food, quick service!
 *             reviewedAt:
 *               type: string
 *               format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ApiError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: This order has already been cancelled.
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Missing or invalid authentication cookie
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 *           example:
 *             success: false
 *             message: Unauthorized. Please log in.
 *     ForbiddenError:
 *       description: Authenticated but not allowed to access/modify this resource
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 *           example:
 *             success: false
 *             message: You are only allowed to cancel your own orders.
 *     NotFoundError:
 *       description: Resource does not exist (or does not belong to the requesting student)
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 *           example:
 *             success: false
 *             message: Order not found.
 *     BadRequestError:
 *       description: Validation failed or the action is not allowed in the order's current state
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiError'
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     description: >
 *       Creates an order for the logged-in student. For `paymentMethod: cash`,
 *       the cafe/admin are notified immediately. For `paymentMethod: online`,
 *       a Cashfree payment session is created and returned in
 *       `paymentSessionId`; the cafe/admin are only notified once the
 *       payment actually succeeds (via the Cashfree webhook).
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
 *                 example: 64f1a2b3c4d5e6f7a8b9c0d3
 *               paymentMethod:
 *                 type: string
 *                 enum: [cash, online]
 *                 example: online
 *               orderType:
 *                 type: string
 *                 enum: [pickup, delivery]
 *                 default: pickup
 *               notes:
 *                 type: string
 *                 example: Please pack cutlery
 *               deliveryAddress:
 *                 $ref: '#/components/schemas/DeliveryAddress'
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - menuItemId
 *                     - quantity
 *                   properties:
 *                     menuItemId:
 *                       type: string
 *                       example: 64f1a2b3c4d5e6f7a8b9c0d1
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *                     specialInstructions:
 *                       type: string
 *                       example: Less spicy
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 paymentSessionId:
 *                   type: string
 *                   nullable: true
 *                   description: Present only when paymentMethod is "online"
 *                   example: session_9f8a7b6c5d4e3f2a1b0c
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Cafe or one of the menu items was not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
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
 *     description: Returns all orders placed by the currently authenticated student, most recent first.
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Orders fetched successfully
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
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
orderRouter.get(
  "/my-orders",
  authenticate,
  authorize("student"),
  getMyOrdersController,
);

/**
 * @swagger
 * /orders/by-number/{orderNumber}:
 *   get:
 *     summary: Get order by order number
 *     description: >
 *       Fetches a single order by its order number. Scoped to the
 *       authenticated student — an order number belonging to a different
 *       student returns 404, not the order.
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: ORD-20260804-0001
 *     responses:
 *       200:
 *         description: Order fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
orderRouter.get(
  "/by-number/:orderNumber",
  authenticate,
  authorize("student"),
  getOrderByNumberController,
);

/**
 * @swagger
 * /orders/{orderNumber}/verify-payment:
 *   get:
 *     summary: Verify payment status manually
 *     description: >
 *       Manually re-checks the order's payment status with Cashfree and
 *       syncs it if the payment has succeeded. Useful as a fallback if the
 *       webhook is delayed. Scoped to the authenticated student — an order
 *       number belonging to a different student returns 404.
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         example: ORD-20260804-0001
 *     responses:
 *       200:
 *         description: Payment status checked and order returned (order may or may not now be paid)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
orderRouter.get(
  "/:orderNumber/verify-payment",
  authenticate,
  authorize("student"),
  verifyOrderPaymentController,
);

/**
 * @swagger
 * /orders/{orderId}/rate:
 *   post:
 *     summary: Rate a completed order
 *     description: >
 *       Lets a student rate their own order once it reaches `completed`
 *       status. Each order can only be rated once.
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
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
 *                 example: 5
 *               review:
 *                 type: string
 *                 maxLength: 500
 *                 example: Great food, quick service!
 *     responses:
 *       200:
 *         description: Order rated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order rated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
 *     description: >
 *       Cancels the student's own order. Only allowed while the order is in
 *       a cancellable status and within 10 minutes of placement. If the
 *       order was already paid, it's flagged for refund.
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         example: 64f1a2b3c4d5e6f7a8b9c0d1
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
 *                 maxLength: 500
 *                 example: Ordered by mistake
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Order cancelled successfully
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Order is not cancellable (wrong status or window expired) or reason is invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               windowExpired:
 *                 value:
 *                   success: false
 *                   message: Cancellation window has expired. Orders can only be cancelled within 10 minutes of placing them.
 *               wrongStatus:
 *                 value:
 *                   success: false
 *                   message: "Orders with status 'completed' cannot be cancelled. Orders can only be cancelled when their status is: pending, accepted."
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
orderRouter.patch(
  "/:orderId/cancellation",
  authenticate,
  authorize("student"),
  cancelOrderController,
);

/**
 * @swagger
 * /orders/webhook/cashfree:
 *   post:
 *     summary: Cashfree payment webhook
 *     description: >
 *       Server-to-server endpoint called by Cashfree to report payment
 *       status changes. Not intended for direct client use — requires a
 *       valid `x-webhook-signature`/`x-webhook-timestamp` pair generated by
 *       Cashfree. On `PAYMENT_SUCCESS_WEBHOOK`, the matching order is marked
 *       paid and the student/cafe/admin are notified in real time.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Raw Cashfree webhook payload (varies by event type)
 *     parameters:
 *       - in: header
 *         name: x-webhook-timestamp
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-webhook-signature
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing signature headers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               success: false
 *               message: Missing signature headers
 *       401:
 *         description: Invalid webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               success: false
 *               message: Invalid signature
 */
orderRouter.post(
  "/webhook/cashfree",
  express.raw({ type: "application/json" }),
  handleCashfreeWebhookController,
);

export default orderRouter;
