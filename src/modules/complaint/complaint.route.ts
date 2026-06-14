import { Router } from "express";
import {
  createComplaintController,
  getMyComplaintsController,
  getAllComplaintsController,
  getComplaintByIdController,
  updateComplaintStatusController,
} from "./complaint.controller";

import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { upload } from "../../config/multer.config";

import {
  createComplaintSchema,
  getMyComplaintsSchema,
  getAllComplaintsSchema,
  updateComplaintActionSchema,
} from "./complaint.validation";

const complaintRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Complaints
 *   description: Complaint Management APIs
 */

const complaintUpload = upload.fields([{ name: "attachments", maxCount: 5 }]);

/* =========================================================
   STUDENT ROUTES
========================================================= */

/**
 * @swagger
 * /complaints:
 *   post:
 *     summary: Create a complaint
 *     description: Student can create a complaint against an order or cafe.
 *     tags: [Complaints]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *             properties:
 *               cafeId:
 *                 type: string
 *                 example: 6850c9f23b9a8f1c12345678
 *               orderId:
 *                 type: string
 *                 example: 6850c9f23b9a8f1c87654321
 *               category:
 *                 type: string
 *                 enum:
 *                   - food_quality
 *                   - wrong_item
 *                   - late_order
 *                   - refund_issue
 *                   - payment_issue
 *                   - cafe_behavior
 *                   - technical_issue
 *                   - other
 *               subject:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 150
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 2000
 *               priority:
 *                 type: string
 *                 enum:
 *                   - low
 *                   - medium
 *                   - high
 *                   - urgent
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Complaint created successfully
 */
complaintRouter.post(
  "/",
  authenticate,
  complaintUpload,
  validate(createComplaintSchema),
  createComplaintController,
);

/**
 * @swagger
 * /complaints/my-complaints:
 *   get:
 *     summary: Get logged-in user's complaints
 *     tags: [Complaints]
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
complaintRouter.get(
  "/my-complaints",
  authenticate,
  validate(getMyComplaintsSchema),
  getMyComplaintsController,
);

/* =========================================================
   ADMIN ROUTES
========================================================= */

/**
 * @swagger
 * /complaints:
 *   get:
 *     summary: Get all complaints
 *     description: Super Admin can view all complaints.
 *     tags: [Complaints]
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
complaintRouter.get(
  "/",
  authenticate,
  authorize("super_admin"),
  validate(getAllComplaintsSchema),
  getAllComplaintsController,
);

/**
 * @swagger
 * /complaints/{id}:
 *   get:
 *     summary: Get complaint details by ID
 *     tags: [Complaints]
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
complaintRouter.get("/:id", authenticate, getComplaintByIdController);

/**
 * @swagger
 * /complaints/{id}/action:
 *   patch:
 *     summary: Update complaint status
 *     description: Super Admin can review, resolve, reject, close or reopen complaints.
 *     tags: [Complaints]
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
complaintRouter.patch(
  "/:id/action",
  authenticate,
  authorize("super_admin"),
  validate(updateComplaintActionSchema),
  updateComplaintStatusController,
);

export default complaintRouter;
