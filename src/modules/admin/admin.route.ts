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
 *     description: Retrieve all registered users including students, cafe owners, admins and super admins.
 *     tags: [SuperAdmin]
 *     security:
 *       - cookieAuth: []
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
 *                 users:
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

export default adminRouter;
