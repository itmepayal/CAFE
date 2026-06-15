import {
  findApprovedCafes,
  findCafeByUserId,
  updateCafeByUserId,
  toggleCafeOpen,
  createMenuItemRepo,
  findMenuItemByIdRepo,
  updateMenuItemRepo,
  deleteMenuItemRepo,
  saveMenuItemRepo,
  findMyComplaints,
} from "./owner.repository";
import { BadRequestError, NotFoundError } from "../../utils/errors/app.error";
import { findCafeRepo } from "../menu/menu.repository";

// =========================================
// GET ALL APPROVED CAFES
// =========================================
export const getApprovedCafesService = async (
  search?: string,
  city?: string,
  page: number = 1,
  limit: number = 10,
) => {
  return await findApprovedCafes(search, city, page, limit);
};

// =========================================
// GET MY CAFE (OWNER)
// =========================================
export const getMyCafeService = async (userId: string) => {
  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found for this user");
  }

  return cafe;
};

// =========================================
// UPDATE MY CAFE
// =========================================
export const updateMyCafeService = async (userId: string, payload: any) => {
  const updated = await updateCafeByUserId(userId, payload);

  if (!updated) {
    throw new NotFoundError("Cafe not found or update failed");
  }

  return updated;
};

// =========================================
// TOGGLE OPEN / CLOSE CAFE
// =========================================
export const toggleCafeOpenService = async (userId: string) => {
  const cafe = await toggleCafeOpen(userId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  return cafe;
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

// =========================================
// GET MY COMPLAINTS SERVICE
// =========================================
export const getMyComplaintsService = async (
  userId: string,
  status?: string,
  category?: string,
  page?: number,
  limit?: number,
) => {
  return await findMyComplaints(userId, status, category, page, limit);
};
