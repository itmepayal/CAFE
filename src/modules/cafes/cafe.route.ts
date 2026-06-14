import { Router } from "express";
import {
  registerCafeController,
  getApprovedCafesController,
  getCafeByIdController,
  getMyCafeController,
  updateMyCafeController,
  toggleCafeOpenController,
  getPendingCafesController,
  updateCafeStatusController,
} from "./cafe.controller";

import { upload } from "../../config/multer.config";
import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  registerCafeSchema,
  updateCafeSchema,
  updateCafeStatusSchema,
  getCafeQuerySchema,
} from "./cafe.validation";

export const cafeRouter = Router();

// =========================================================
// PUBLIC ROUTES
// =========================================================
cafeRouter.get("/", validate(getCafeQuerySchema), getApprovedCafesController);
cafeRouter.get("/:id", getCafeByIdController);

// =========================================================
// STUDENT ROUTES
// =========================================================
cafeRouter.post(
  "/register",
  authenticate,
  authorize("student"),
  upload.fields([
    { name: "cafeImage", maxCount: 1 },
    { name: "menuImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
    { name: "aadharPhoto", maxCount: 1 },
    { name: "panPhoto", maxCount: 1 },
    { name: "fssaiCertificate", maxCount: 1 },
    { name: "bankPassbookPhoto", maxCount: 1 },
  ]),
  validate(registerCafeSchema),
  registerCafeController,
);

// =========================================================
// OWNER ROUTES
// =========================================================

cafeRouter.get(
  "/my-cafe",
  authenticate,
  authorize("cafe_owner"),
  getMyCafeController,
);
cafeRouter.put(
  "/my-cafe",
  authenticate,
  authorize("cafe_owner"),
  upload.fields([
    { name: "cafeImage", maxCount: 1 },
    { name: "menuImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
    { name: "aadharPhoto", maxCount: 1 },
    { name: "panPhoto", maxCount: 1 },
    { name: "fssaiCertificate", maxCount: 1 },
    { name: "bankPassbookPhoto", maxCount: 1 },
  ]),
  validate(updateCafeSchema),
  updateMyCafeController,
);
cafeRouter.patch(
  "/my-cafe/toggle-open",
  authenticate,
  authorize("cafe_owner"),
  toggleCafeOpenController,
);

// =========================================================
// ADMIN ROUTES
// =========================================================
cafeRouter.get(
  "/pending",
  authenticate,
  authorize("admin", "super_admin"),
  getPendingCafesController,
);
cafeRouter.patch(
  "/:id/status",
  authenticate,
  authorize("admin", "super_admin"),
  validate(updateCafeStatusSchema),
  updateCafeStatusController,
);

export default cafeRouter;
