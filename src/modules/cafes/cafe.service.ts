import {
  createCafe,
  findApprovedCafes,
  findCafeById,
  findCafeByUserId,
} from "./cafe.repository";
import { BadRequestError, NotFoundError } from "../../utils/errors/app.error";
import { logger } from "../../config/logger.config";

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
  });

  logger.info(`Cafe registered with id: ${cafe?._id}`);

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
