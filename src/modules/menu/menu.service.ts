import {
  findCafeRepo,
  findMenuItemByIdRepo,
  getMenuItemsByCafeRepo,
} from "./menu.repository";

import { ForbiddenError } from "../../utils/errors/app.error";
import { logger } from "../../config/logger.config";

/**
 * =========================================================
 * GET CAFE MENU
 * =========================================================
 */
export const getCafeMenuService = async (cafeId: string) => {
  logger.info(`Fetching menu for cafe: ${cafeId}`);

  await findCafeRepo(cafeId);

  const menuItems = await getMenuItemsByCafeRepo(cafeId);

  logger.info(`Fetched ${menuItems.length} menu items for cafe: ${cafeId}`);

  return menuItems;
};

/**
 * =========================================================
 * GET SINGLE MENU ITEM
 * =========================================================
 */
export const getMenuItemService = async (itemId: string) => {
  logger.info(`Fetching menu item: ${itemId}`);

  const item = await findMenuItemByIdRepo(itemId);

  if (!item) {
    logger.warn(`Menu item not found: ${itemId}`);
  }

  return item;
};

/**
 * =========================================================
 * VERIFY CAFE OWNERSHIP
 * =========================================================
 */
export const verifyCafeOwnershipService = async (
  cafeId: string,
  userId: string,
) => {
  logger.info(`Verifying ownership of cafe ${cafeId} for user ${userId}`);

  const cafe = await findCafeRepo(cafeId);

  if (cafe.userId.toString() !== userId) {
    logger.warn(
      `Unauthorized attempt: user ${userId} tried to manage cafe ${cafeId}`,
    );
    throw new ForbiddenError("You are not allowed to manage this cafe");
  }

  return cafe;
};
