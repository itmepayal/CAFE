import { Router } from "express";
import {
  getMyCafeController,
  updateMyCafeController,
  toggleCafeOpenController,
  createMenuItemController,
  updateMenuItemController,
  deleteMenuItemController,
  toggleMenuAvailabilityController,
  getMyComplaintsController,
  getMyMenuItemsController,
  getMyCafeOrdersController,
  getCafeOrderDetailsController,
  updateOrderStatusController,
  acceptOrderController,
  rejectOrderController,
  markOrderPreparingController,
  markOrderReadyController,
  completePickupOrderController,
  getOwnerDashboardController,
  getOwnerTransactionsController,
} from "./owner.controller";

import { upload } from "../../config/multer.config";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

import {
  createMenuItemSchema,
  getMyComplaintsSchema,
  menuItemParamsSchema,
  toggleAvailabilitySchema,
  updateCafeSchema,
  updateMenuItemSchema,
  getOwnerTransactionsSchema,
  getMyCafeOrdersSchema,
  acceptOrderSchema,
  rejectOrderSchema,
  completePickupOrderSchema,
  orderIdParamsSchema,
} from "./owner.validation";

const ownerRouter = Router();

ownerRouter.get(
  "/dashboard",
  authenticate,
  authorize("cafe_owner"),
  getOwnerDashboardController,
);

ownerRouter.get(
  "/transactions",
  authenticate,
  authorize("cafe_owner"),
  validate(getOwnerTransactionsSchema),
  getOwnerTransactionsController,
);

ownerRouter.get(
  "/cafes/my-cafe",
  authenticate,
  authorize("cafe_owner"),
  getMyCafeController,
);

ownerRouter.put(
  "/cafes/my-cafe",
  authenticate,
  authorize("cafe_owner"),
  upload.fields([
    { name: "cafeImage", maxCount: 1 },
    { name: "menuImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
    { name: "layoutPhotos", maxCount: 10 },
    { name: "interiorPhotos", maxCount: 10 },
    { name: "exteriorPhotos", maxCount: 10 },
    { name: "aadharPhoto", maxCount: 1 },
    { name: "panPhoto", maxCount: 1 },
    { name: "fssaiCertificate", maxCount: 1 },
    { name: "bankPassbookPhoto", maxCount: 1 },
  ]),
  validate(updateCafeSchema),
  updateMyCafeController,
);

ownerRouter.patch(
  "/cafes/my-cafe/toggle-open",
  authenticate,
  authorize("cafe_owner"),
  toggleCafeOpenController,
);

ownerRouter.get(
  "/cafes/my-cafe/menus",
  authenticate,
  authorize("cafe_owner"),
  getMyMenuItemsController,
);

ownerRouter.post(
  "/cafes/my-cafe/menus",
  authenticate,
  authorize("cafe_owner"),
  upload.single("image"),
  validate(createMenuItemSchema),
  createMenuItemController,
);

ownerRouter.put(
  "/cafes/my-cafe/menus/:itemId",
  authenticate,
  authorize("cafe_owner"),
  upload.single("image"),
  validate(menuItemParamsSchema),
  validate(updateMenuItemSchema),
  updateMenuItemController,
);

ownerRouter.delete(
  "/cafes/my-cafe/menus/:itemId",
  authenticate,
  authorize("cafe_owner"),
  validate(menuItemParamsSchema),
  deleteMenuItemController,
);

ownerRouter.patch(
  "/cafes/my-cafe/menus/:itemId/availability/toggle",
  authenticate,
  authorize("cafe_owner"),
  validate(toggleAvailabilitySchema),
  toggleMenuAvailabilityController,
);

ownerRouter.get(
  "/cafes/my-cafe/orders",
  authenticate,
  authorize("cafe_owner"),
  validate(getMyCafeOrdersSchema),
  getMyCafeOrdersController,
);

ownerRouter.get(
  "/cafes/my-cafe/orders/:orderId",
  authenticate,
  authorize("cafe_owner"),
  validate(orderIdParamsSchema),
  getCafeOrderDetailsController,
);

ownerRouter.patch(
  "/cafes/my-cafe/orders/:orderId/status",
  authenticate,
  authorize("cafe_owner"),
  validate(orderIdParamsSchema),
  updateOrderStatusController,
);

ownerRouter.patch(
  "/cafes/my-cafe/orders/:orderId/accept",
  authenticate,
  authorize("cafe_owner"),
  validate(acceptOrderSchema),
  acceptOrderController,
);

ownerRouter.patch(
  "/cafes/my-cafe/orders/:orderId/reject",
  authenticate,
  authorize("cafe_owner"),
  validate(rejectOrderSchema),
  rejectOrderController,
);

ownerRouter.patch(
  "/cafes/my-cafe/orders/:orderId/preparing",
  authenticate,
  authorize("cafe_owner"),
  validate(orderIdParamsSchema),
  markOrderPreparingController,
);

ownerRouter.patch(
  "/cafes/my-cafe/orders/:orderId/ready",
  authenticate,
  authorize("cafe_owner"),
  validate(orderIdParamsSchema),
  markOrderReadyController,
);

ownerRouter.patch(
  "/cafes/my-cafe/orders/:orderId/complete",
  authenticate,
  authorize("cafe_owner"),
  validate(completePickupOrderSchema),
  completePickupOrderController,
);

ownerRouter.get(
  "/cafes/my-cafe/complaints",
  authenticate,
  authorize("cafe_owner"),
  validate(getMyComplaintsSchema),
  getMyComplaintsController,
);

export default ownerRouter;
