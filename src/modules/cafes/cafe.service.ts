import {
  createCafe,
  findApprovedCafes,
  findCafeById,
  findCafeByUserId,
} from "./cafe.repository";
import { BadRequestError, NotFoundError } from "../../utils/errors/app.error";
import { logger } from "../../config/logger.config";
import User from "../../models/user";

// =========================================
// REGISTER CAFE
// =========================================
export const registerCafeService = async (userId: string, payload: any) => {
  logger.info(`Registering cafe for user ${userId}`);

  const existingCafe = await findCafeByUserId(userId);

  if (existingCafe) {
    logger.warn(`User ${userId} already has a registered cafe`);
    throw new BadRequestError("Cafe already registered for this user");
  }

  const cafe = await createCafe({
    ...payload,
    userId,
    status: "pending",
    isBlocked: false,
    isOpen: false,
    isFeatured: false,
    supportsDelivery: payload.supportsDelivery ?? false,
  });

  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        role: "cafe_owner",
      },
    },
    {
      new: true,
    },
  );

  logger.info(
    `Cafe registered with id: ${cafe?._id}, user role updated to cafe_owner`,
  );

  return cafe;
};

// =========================================
// GET ALL APPROVED CAFES
// =========================================
export const getApprovedCafesService = async (
  search?: string,
  city?: string,
  page: number = 1,
  limit: number = 10,
) => {
  logger.info(
    `Fetching approved cafes (search: ${search ?? "none"}, city: ${
      city ?? "none"
    }, page: ${page}, limit: ${limit})`,
  );

  return await findApprovedCafes(search, city, page, limit);
};

// =========================================
// GET CAFE BY ID
// =========================================
export const getCafeByIdService = async (id: string) => {
  logger.info(`Fetching cafe by id: ${id}`);

  const cafe = await findCafeById(id);

  if (!cafe) {
    logger.warn(`Cafe not found: ${id}`);
    throw new NotFoundError("Cafe not found");
  }

  return cafe;
};

// =========================================
// GET MY CAFE
// =========================================
export const getMyCafeService = async (userId: string) => {
  logger.info(`Fetching own cafe for user ${userId}`);

  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    throw new NotFoundError("No cafe registered for this user");
  }

  if (cafe.status === "pending") {
    return {
      status: "pending",
      message:
        "Your cafe registration is under review. You'll be notified once approved.",
    };
  }

  if (cafe.status === "rejected") {
    return {
      status: "rejected",
      message: "Your cafe registration was rejected.",
      adminNote: cafe.adminNote,
    };
  }

  return cafe;
};
