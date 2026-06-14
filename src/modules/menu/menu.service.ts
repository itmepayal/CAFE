import {
  createMenuItemRepo,
  deleteMenuItemRepo,
  findCafeRepo,
  findMenuItemByIdRepo,
  getMenuItemsByCafeRepo,
  saveMenuItemRepo,
  updateMenuItemRepo,
} from "./menu.repository";

import { BadRequestError, ForbiddenError } from "../../utils/errors/app.error";

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
 * CREATE MENU ITEM
 * =========================================================
 */
export const createMenuItemService = async (cafeId: string, payload: any) => {
  await findCafeRepo(cafeId);

  if (payload.discountedPrice && payload.discountedPrice >= payload.price) {
    throw new BadRequestError("Discounted price must be less than price");
  }

  return createMenuItemRepo({
    ...payload,
    cafeId,
  });
};

/**
 * =========================================================
 * UPDATE MENU ITEM
 * =========================================================
 */
export const updateMenuItemService = async (itemId: string, payload: any) => {
  const item = await findMenuItemByIdRepo(itemId);

  const price = payload.price ?? item.price;

  const discountedPrice = payload.discountedPrice ?? item.discountedPrice;

  if (discountedPrice && discountedPrice >= price) {
    throw new BadRequestError("Discounted price must be less than price");
  }

  return updateMenuItemRepo(itemId, payload);
};

/**
 * =========================================================
 * DELETE MENU ITEM
 * =========================================================
 */
export const deleteMenuItemService = async (itemId: string) => {
  return deleteMenuItemRepo(itemId);
};

/**
 * =========================================================
 * TOGGLE MENU AVAILABILITY
 * =========================================================
 */
export const toggleMenuAvailabilityService = async (itemId: string) => {
  const item = await findMenuItemByIdRepo(itemId);

  item.isAvailable = !item.isAvailable;

  return saveMenuItemRepo(item);
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
