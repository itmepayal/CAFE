import { Router } from "express";
import {
  getAvailableDeliveryOrdersController,
  acceptDeliveryOrderController,
  getMyDeliveriesController,
  getDeliveryOrderByIdController,
  updateDeliveryStatusController,
  cancelDeliveryAssignmentController,
} from "./delivery.controller";

import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  getAvailableDeliveryOrdersSchema,
  getMyDeliveriesSchema,
  deliveryOrderIdParamSchema,
  updateDeliveryStatusSchema,
} from "./delivery.validation";

const deliveryRouter = Router();

// All delivery routes require authentication and student role (or admin)
deliveryRouter.use(authenticate, authorize("student", "super_admin"));

/**
 * @swagger
 * tags:
 *   name: Student Delivery
 *   description: Student delivery partner APIs for accepting and fulfilling food delivery orders.
 */

/**
 * @swagger
 * /delivery/available:
 *   get:
 *     summary: Browse available orders ready for delivery
 *     description: >
 *       Returns a paginated list of delivery orders (`orderType: delivery`) that have not yet been assigned (`deliveryStatus: not_assigned`)
 *       and are currently accepted/preparing/ready.
 *     tags: [Student Delivery]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: cafeId
 *         schema:
 *           type: string
 *         description: Filter available deliveries by cafe ID
 *       - in: query
 *         name: hostelName
 *         schema:
 *           type: string
 *         description: Filter available deliveries by destination hostel name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Available delivery orders fetched successfully
 *       401:
 *         description: Unauthorized
 */
deliveryRouter.get(
  "/available",
  validate(getAvailableDeliveryOrdersSchema),
  getAvailableDeliveryOrdersController,
);

/**
 * @swagger
 * /delivery/my-deliveries:
 *   get:
 *     summary: Get deliveries claimed/completed by logged-in student
 *     description: >
 *       List all delivery tasks assigned to the current student partner.
 *       Query `?active=true` returns assigned & out_for_delivery orders.
 *       Query `?history=true` returns completed delivered orders.
 *     tags: [Student Delivery]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: history
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: deliveryStatus
 *         schema:
 *           type: string
 *           enum: [assigned, out_for_delivery, delivered]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: My deliveries fetched successfully
 *       401:
 *         description: Unauthorized
 */
deliveryRouter.get(
  "/my-deliveries",
  validate(getMyDeliveriesSchema),
  getMyDeliveriesController,
);

/**
 * @swagger
 * /delivery/orders/{orderId}:
 *   get:
 *     summary: Get single delivery order details
 *     description: Returns full delivery order details including customer address, contact number, items, and cafe location.
 *     tags: [Student Delivery]
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
 *         description: Delivery details fetched successfully
 *       403:
 *         description: Not authorized to view this delivery
 *       404:
 *         description: Delivery order not found
 */
deliveryRouter.get(
  "/orders/:orderId",
  validate(deliveryOrderIdParamSchema),
  getDeliveryOrderByIdController,
);

/**
 * @swagger
 * /delivery/orders/{orderId}/accept:
 *   post:
 *     summary: Claim/Accept an available delivery order
 *     description: >
 *       Atomically assigns the order to the authenticated student deliverer.
 *       Sets `deliveryStatus: assigned` and `deliveryPersonId: req.user.id`.
 *     tags: [Student Delivery]
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
 *         description: Delivery order accepted successfully
 *       400:
 *         description: Invalid order state or student trying to deliver their own order
 *       409:
 *         description: Order already claimed by another delivery partner
 */
deliveryRouter.post(
  "/orders/:orderId/accept",
  validate(deliveryOrderIdParamSchema),
  acceptDeliveryOrderController,
);

/**
 * @swagger
 * /delivery/orders/{orderId}/status:
 *   patch:
 *     summary: Update delivery status (out_for_delivery | delivered)
 *     description: >
 *       - Transition from `assigned` to `out_for_delivery`: Sets `order.status = out_for_delivery` and updates timestamp.
 *       - Transition from `out_for_delivery` to `delivered`: Sets `order.status = completed` and updates timestamp.
 *     tags: [Student Delivery]
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [out_for_delivery, delivered]
 *     responses:
 *       200:
 *         description: Delivery status updated successfully
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Forbidden — not assigned to this delivery
 */
deliveryRouter.patch(
  "/orders/:orderId/status",
  validate(updateDeliveryStatusSchema),
  updateDeliveryStatusController,
);

/**
 * @swagger
 * /delivery/orders/{orderId}/cancel:
 *   patch:
 *     summary: Unassign / Cancel delivery claim
 *     description: >
 *       Allows the delivery partner to release an accepted delivery before picking it up (`out_for_delivery`).
 *       Resets `deliveryStatus: not_assigned` and `deliveryPersonId: null`.
 *     tags: [Student Delivery]
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
 *         description: Delivery claim cancelled successfully
 *       400:
 *         description: Cannot unassign after picking up order
 *       403:
 *         description: Forbidden — not assigned to this delivery
 */
deliveryRouter.patch(
  "/orders/:orderId/cancel",
  validate(deliveryOrderIdParamSchema),
  cancelDeliveryAssignmentController,
);

export default deliveryRouter;
