import {
  findCafeRepo,
  findMenuItemByIdRepo,
  getMenuItemsByCafeRepo,
} from "./menu.repository";

import { ForbiddenError } from "../../utils/errors/app.error";

/**
 * =========================================================
 * GET CAFE MENU
 * =========================================================
 */
export const getCafeMenuService = async (cafeId: string) => {
  await findCafeRepo(cafeId);

  return getMenuItemsByCafeRepo(cafeId);
};

/**
 * =========================================================
 * GET SINGLE MENU ITEM
 * =========================================================
 */
export const getMenuItemService = async (itemId: string) => {
  return findMenuItemByIdRepo(itemId);
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
  const cafe = await findCafeRepo(cafeId);

  if (cafe.userId.toString() !== userId) {
    throw new ForbiddenError("You are not allowed to manage this cafe");
  }

  return cafe;
};
