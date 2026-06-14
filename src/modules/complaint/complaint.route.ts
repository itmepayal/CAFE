import { Router } from "express";
import {
  createComplaintController,
  getMyComplaintsController,
  getAllComplaintsController,
  getComplaintByIdController,
  updateComplaintStatusController,
} from "./complaint.controller";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { upload } from "../../config/multer.config";

import {
  createComplaintSchema,
  getMyComplaintsSchema,
  getAllComplaintsSchema,
  updateComplaintActionSchema,
} from "./complaint.validation";

const complaintRouter = Router();

// =========================================
// FILE UPLOAD CONFIG
// =========================================
const complaintUpload = upload.fields([{ name: "attachments", maxCount: 5 }]);

// =========================================
// STUDENT ROUTES
// =========================================
complaintRouter.post(
  "/",
  authenticate,
  complaintUpload,
  validate(createComplaintSchema),
  createComplaintController,
);
complaintRouter.get(
  "/my-complaints",
  authenticate,
  validate(getMyComplaintsSchema),
  getMyComplaintsController,
);

// =========================================
// ADMIN ROUTES
// =========================================
complaintRouter.get(
  "/",
  authenticate,
  authorize("admin"),
  validate(getAllComplaintsSchema),
  getAllComplaintsController,
);
complaintRouter.get("/:id", authenticate, getComplaintByIdController);
complaintRouter.patch(
  "/:id/action",
  authenticate,
  authorize("admin"),
  validate(updateComplaintActionSchema),
  updateComplaintStatusController,
);

export default complaintRouter;
