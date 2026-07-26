import { Router } from "express";
import {
  getAllUsersController,
  approveCafeController,
  rejectCafeController,
  toggleCafeBlockController,
  updateComplaintStatusController,
  getComplaintByIdController,
  getAllComplaintsController,
  getPendingCafesController,
  triggerSpecificOrderCancelController,
  getAllOrdersController,
  getOrderByIdController,
  forceCancelOrderController,
  refundOrderController,
  getOrderStatsController,
} from "./admin.controller";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  getAllComplaintsSchema,
  updateComplaintActionSchema,
} from "./admin.validation";

const adminRouter = Router();

/**
 * @swagger
 * tags:
 *   name: SuperAdmin
 *   description: Super Admin Management APIs
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve all registered users. Optionally filter users by role.
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         required: false
 *         description: Filter users by role
 *         schema:
 *           type: string
 *           enum:
 *             - student
 *             - cafe_owner
 *             - super_admin
 *     responses:
 *       200:
 *         description: Users fetched successfully
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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied. Super admin only.
 */
adminRouter.get(
  "/users",
  authenticate,
  authorize("super_admin"),
  getAllUsersController,
);

/**
 * @swagger
 * /admin/cafes/{id}/approve:
 *   patch:
 *     summary: Approve cafe registration
 *     description: Approves a pending cafe and promotes its owner to cafe_owner role.
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Cafe ID
 *         schema:
 *           type: string
 *           example: 684bc8f4f1c5c7f1d8f3a1b2
 *     responses:
 *       200:
 *         description: Cafe approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Cafe approved successfully
 *                 cafe:
 *                   type: object
 *       404:
 *         description: Cafe not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
adminRouter.patch(
  "/cafes/:id/approve",
  authenticate,
  authorize("super_admin"),
  approveCafeController,
);

/**
 * @swagger
 * /admin/cafes/{id}/reject:
 *   patch:
 *     summary: Reject cafe registration
 *     description: Rejects a cafe application and stores an admin note.
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Cafe ID
 *         schema:
 *           type: string
 *           example: 684bc8f4f1c5c7f1d8f3a1b2
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminNote
 *             properties:
 *               adminNote:
 *                 type: string
 *                 example: Missing required business documents.
 *     responses:
 *       200:
 *         description: Cafe rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Cafe rejected successfully
 *                 cafe:
 *                   type: object
 *       404:
 *         description: Cafe not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
adminRouter.patch(
  "/cafes/:id/reject",
  authenticate,
  authorize("super_admin"),
  rejectCafeController,
);

/**
 * @swagger
 * /admin/cafes/{id}/block:
 *   patch:
 *     summary: Block or unblock cafe
 *     description: Toggles the blocked status of an approved cafe.
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Cafe ID
 *         schema:
 *           type: string
 *           example: 684bc8f4f1c5c7f1d8f3a1b2
 *     responses:
 *       200:
 *         description: Cafe block status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Cafe blocked successfully
 *                 cafe:
 *                   type: object
 *       404:
 *         description: Cafe not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
adminRouter.patch(
  "/cafes/:id/block",
  authenticate,
  authorize("super_admin"),
  toggleCafeBlockController,
);

/**
 * @swagger
 * /admin/complaints:
 *   get:
 *     summary: Get all complaints
 *     description: Super Admin can view all complaints.
 *     tags: [SuperAdmin]
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
 *         name: priority
 *         schema:
 *           type: string
 *           enum:
 *             - low
 *             - medium
 *             - high
 *             - urgent
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
adminRouter.get(
  "/complaints",
  authenticate,
  authorize("super_admin"),
  validate(getAllComplaintsSchema),
  getAllComplaintsController,
);

/**
 * @swagger
 * /admin/complaints/{id}:
 *   get:
 *     summary: Get complaint details by ID
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Complaint details fetched successfully
 *       404:
 *         description: Complaint not found
 */
adminRouter.get(
  "/complaints/:id",
  authenticate,
  authorize("super_admin"),
  getComplaintByIdController,
);

/**
 * @swagger
 * /admin/complaints/{id}/action:
 *   patch:
 *     summary: Update complaint status
 *     description: Super Admin can review, resolve, reject, close or reopen complaints.
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                   - open
 *                   - in_review
 *                   - resolved
 *                   - rejected
 *                   - closed
 *               adminNote:
 *                 type: string
 *                 maxLength: 2000
 *               resolution:
 *                 type: string
 *                 maxLength: 2000
 *               assignedTo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Complaint updated successfully
 *       404:
 *         description: Complaint not found
 */
adminRouter.patch(
  "/complaints/:id/action",
  authenticate,
  authorize("super_admin"),
  validate(updateComplaintActionSchema),
  updateComplaintStatusController,
);

/**
 * @swagger
 * /admin/cafes/pending:
 *   get:
 *     summary: Get all pending cafe requests
 *     description: Super Admin can view all cafes waiting for approval.
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Pending cafes fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
adminRouter.get(
  "/cafes/pending",
  authenticate,
  authorize("super_admin"),
  getPendingCafesController,
);

/**
 * @swagger
 * /admin/orders/auto-cancel/trigger/{orderId}:
 *   post:
 *     summary: Manually trigger auto-cancel for a specific order
 *     description: >
 *       Cancels a single order if it is still in "pending" status, bypassing
 *       the wait for the scheduled auto-cancel cron job. Useful for testing
 *       or emergency manual intervention on a specific stale order.
 *       Restricted to super_admin.
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         description: ID of the order to cancel
 *         schema:
 *           type: string
 *           example: 6a4cbb418eeb8e1b5ab76d0a
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
 *                   example: Order 6a4cbb418eeb8e1b5ab76d0a cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — only super_admin can trigger this job
 *       404:
 *         description: Pending order not found with this ID
 */
adminRouter.post(
  "/orders/auto-cancel/trigger/:orderId",
  authenticate,
  authorize("super_admin"),
  triggerSpecificOrderCancelController,
);

/**
 * @swagger
 * /admin/orders/stats:
 *   get:
 *     summary: Get order statistics
 *     description: Returns status-wise order counts, total revenue, today's order count, and total orders. Restricted to super_admin.
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Order stats fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied. Super admin only.
 */
adminRouter.get(
  "/orders/stats",
  authenticate,
  authorize("super_admin"),
  getOrderStatsController,
);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders
 *     description: Super Admin can view all orders with optional filters and pagination.
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderType
 *         schema:
 *           type: string
 *           enum:
 *             - pickup
 *             - delivery
 *       - in: query
 *         name: cafeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
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
 *         description: Orders fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
adminRouter.get(
  "/orders",
  authenticate,
  authorize("super_admin"),
  getAllOrdersController,
);

/**
 * @swagger
 * /admin/orders/{id}:
 *   get:
 *     summary: Get single order by ID
 *     description: Super Admin can view full details of a single order, including student, cafe, and delivery person info.
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order fetched successfully
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
adminRouter.get(
  "/orders/:id",
  authenticate,
  authorize("super_admin"),
  getOrderByIdController,
);

/**
 * @swagger
 * /admin/orders/{id}/force-cancel:
 *   patch:
 *     summary: Force cancel an order
 *     description: Super Admin can cancel any order regardless of current status (except already completed/cancelled).
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                 example: Cancelled due to customer complaint
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       400:
 *         description: Order already completed or cancelled
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
adminRouter.patch(
  "/orders/:id/force-cancel",
  authenticate,
  authorize("super_admin"),
  forceCancelOrderController,
);

/**
 * @swagger
 * /admin/orders/{id}/refund:
 *   patch:
 *     summary: Mark order as refunded
 *     description: Super Admin can mark a paid order's payment status as refunded (used when resolving complaints).
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order marked as refunded
 *       400:
 *         description: Only paid orders can be refunded
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
adminRouter.patch(
  "/orders/:id/refund",
  authenticate,
  authorize("super_admin"),
  refundOrderController,
);

export default adminRouter;
