import User, { IUser } from "../../models/user";
import Cafe, { ICafe } from "../../models/cafe";

import {
  InternalServerError,
  NotFoundError,
} from "../../utils/errors/app.error";

/**
 * =========================================================
 * GET ALL USERS
 * =========================================================
 */
export const getAllUsersRepo = async () => {
  return User.find()
    .select("-deviceTokens")
    .populate("ownedCafe")
    .sort({ createdAt: -1 })
    .catch(() => {
      throw new InternalServerError("Failed to fetch users");
    });
};

/**
 * =========================================================
 * FIND CAFE
 * =========================================================
 */
export const findCafeByIdRepo = async (cafeId: string): Promise<ICafe> => {
  const cafe = await Cafe.findById(cafeId).catch(() => {
    throw new InternalServerError("Failed to fetch cafe");
  });

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  return cafe;
};

/**
 * =========================================================
 * SAVE CAFE
 * =========================================================
 */
export const saveCafeRepo = async (cafe: ICafe): Promise<ICafe> => {
  return cafe.save().catch(() => {
    throw new InternalServerError("Failed to save cafe");
  });
};

/**
 * =========================================================
 * SAVE USER
 * =========================================================
 */
export const saveUserRepo = async (user: IUser): Promise<IUser> => {
  return user.save().catch(() => {
    throw new InternalServerError("Failed to save user");
  });
};

// =========================================
// FIND PENDING CAFES
// =========================================
export const findPendingCafes = async (): Promise<ICafe[]> => {
  return await Cafe.find({ status: "pending" }).sort({ createdAt: -1 }).lean();
};
