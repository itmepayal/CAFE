import User from "../../models/user";

import {
  findCafeByIdRepo,
  findPendingCafes,
  getAllUsersRepo,
  saveCafeRepo,
  saveUserRepo,
} from "./admin.repository";
import { NotFoundError } from "../../utils/errors/app.error";

/**
 * =========================================================
 * GET ALL USERS
 * =========================================================
 */
export const getAllUsersService = async () => {
  return getAllUsersRepo();
};

/**
 * =========================================================
 * APPROVE CAFE
 * =========================================================
 */
export const approveCafeService = async (cafeId: string) => {
  const cafe = await findCafeByIdRepo(cafeId);

  const owner = await User.findById(cafe.ownerName);

  if (!owner) {
    throw new NotFoundError("Cafe owner not found");
  }

  cafe.status = "approved";

  owner.role = "cafe_owner";
  owner.ownedCafe = cafe._id;

  await saveCafeRepo(cafe);
  await saveUserRepo(owner);

  return cafe;
};

/**
 * =========================================================
 * REJECT CAFE
 * =========================================================
 */
export const rejectCafeService = async (cafeId: string, adminNote: string) => {
  const cafe = await findCafeByIdRepo(cafeId);

  cafe.status = "rejected";
  cafe.adminNote = adminNote;

  return saveCafeRepo(cafe);
};

/**
 * =========================================================
 * BLOCK / UNBLOCK CAFE
 * =========================================================
 */
export const toggleCafeBlockService = async (cafeId: string) => {
  const cafe = await findCafeByIdRepo(cafeId);
  cafe.isBlocked = !cafe.isBlocked;
  return saveCafeRepo(cafe);
};

// =========================================
// GET PENDING CAFES
// =========================================
export const getPendingCafesService = async () => {
  return await findPendingCafes();
};
