import { Router } from "express";
import { createComplaintController } from "./complaint.controller";

import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { upload } from "../../config/multer.config";

import { createComplaintSchema } from "./complaint.validation";

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

export default complaintRouter;
