import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

import {
  cafeMenuParamsSchema,
  createMenuItemSchema,
  menuItemParamsSchema,
  toggleAvailabilitySchema,
  updateMenuItemSchema,
} from "./menu.validation";

import {
  createMenuItemController,
  deleteMenuItemController,
  getCafeMenuController,
  getMenuItemController,
  toggleMenuAvailabilityController,
  updateMenuItemController,
} from "./menu.controller";

const router = Router();

/**
 * =========================================================
 * STUDENT + CAFE OWNER
 * =========================================================
 */

router.get(
  "/:cafeId",
  authenticate,
  validate(cafeMenuParamsSchema),
  getCafeMenuController,
);

router.get(
  "/item/:itemId",
  authenticate,
  validate(menuItemParamsSchema),
  getMenuItemController,
);

/**
 * =========================================================
 * CAFE OWNER ONLY
 * =========================================================
 */
router.post(
  "/",
  authenticate,
  authorize("cafe_owner"),
  validate(createMenuItemSchema),
  createMenuItemController,
);

router.put(
  "/:itemId",
  authenticate,
  authorize("cafe_owner"),
  validate(menuItemParamsSchema),
  validate(updateMenuItemSchema),
  updateMenuItemController,
);

router.delete(
  "/:itemId",
  authenticate,
  authorize("cafe_owner"),
  validate(menuItemParamsSchema),
  deleteMenuItemController,
);

router.patch(
  "/:itemId/availability",
  authenticate,
  authorize("cafe_owner"),
  validate(toggleAvailabilitySchema),
  toggleMenuAvailabilityController,
);

export default router;
