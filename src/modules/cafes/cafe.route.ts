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

const cafeRouter = Router();

/* =========================
   PUBLIC
========================= */

cafeRouter.get("/", validate(getCafeQuerySchema), getApprovedCafesController);

/* =========================
   OWNER
========================= */

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

/* =========================
   REGISTER
========================= */

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

/* =========================
   ADMIN
========================= */

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

/* =========================
   DYNAMIC ROUTES LAST
========================= */

cafeRouter.get("/:id", getCafeByIdController);

export default cafeRouter;
