import { Router } from "express";
import {
  getAllUsersController,
  approveCafeController,
  rejectCafeController,
  toggleCafeBlockController,
  getPendingCafesController,
} from "./admin.controller";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/auth.middleware";

const adminRouter = Router();

/**
 * @swagger
 * tags:
 *   name: SuperAdmin
 *   description: Super Admin Management APIs
 */

/**
 * =========================================================
 * ADMIN ROUTES
 * =========================================================
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
/* =========================================================
   SUPER ADMIN
========================================================= */

/**
 * @swagger
 * /owners/pending:
 *   get:
 *     summary: Get all pending cafe requests
 *     tags: [Owner]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Pending cafes fetched successfully
 */
adminRouter.get(
  "/pending",
  authenticate,
  authorize("super_admin"),
  getPendingCafesController,
);

export default adminRouter;
