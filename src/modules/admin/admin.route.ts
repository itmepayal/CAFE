import { Router } from "express";
import {
  getAllUsersController,
  approveCafeController,
  rejectCafeController,
  toggleCafeBlockController,
} from "./admin.controller";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/auth.middleware";

const adminRouter = Router();

adminRouter.get(
  "/users",
  authenticate,
  authorize("super_admin"),
  getAllUsersController,
);

adminRouter.patch(
  "/cafes/:id/approve",
  authenticate,
  authorize("super_admin"),
  approveCafeController,
);

adminRouter.patch(
  "/cafes/:id/reject",
  authenticate,
  authorize("super_admin"),
  rejectCafeController,
);

adminRouter.patch(
  "/cafes/:id/block",
  authenticate,
  authorize("super_admin"),
  toggleCafeBlockController,
);

export default adminRouter;
