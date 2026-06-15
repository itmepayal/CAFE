import {
  createCafe,
  findApprovedCafes,
  findCafeById,
  findCafeByUserId,
} from "./cafe.repository";
import { BadRequestError, NotFoundError } from "../../utils/errors/app.error";

// =========================================
// REGISTER CAFE
// =========================================
export const registerCafeService = async (userId: string, payload: any) => {
  const existingCafe = await findCafeByUserId(userId);

  if (existingCafe) {
    throw new BadRequestError("Cafe already registered for this user");
  }

  return await createCafe({
    ...payload,
    userId,
    status: "pending",
    isBlocked: false,
    isOpen: false,
    isFeatured: false,
  });
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
  return await findApprovedCafes(search, city, page, limit);
};

// =========================================
// GET CAFE BY ID
// =========================================
export const getCafeByIdService = async (id: string) => {
  const cafe = await findCafeById(id);

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  return cafe;
};
