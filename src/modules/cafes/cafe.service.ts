import {
  createCafe,
  findApprovedCafes,
  findCafeById,
  findCafeByUserId,
  updateCafeByUserId,
  toggleCafeOpen,
  findPendingCafes,
  updateCafeStatus,
} from "./cafe.repository";
import { BadRequestError, NotFoundError } from "../../utils/errors/app.error";

// =========================================
// REGISTER CAFE
// =========================================
export const registerCafeService = async (userId: string, payload: any) => {
  const existing = await findCafeByUserId(userId);

  if (existing) {
    throw new BadRequestError("Cafe already registered for this user");
  }

  return await createCafe({
    ...payload,
    userId,
    status: "pending",
    isBlocked: false,
    isOpen: false,
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

// =========================================
// GET PENDING CAFES
// =========================================
export const getPendingCafesService = async () => {
  return await findPendingCafes();
};

// =========================================
// APPROVE / REJECT CAFE
// =========================================
export const updateCafeStatusService = async (
  cafeId: string,
  status: "approved" | "rejected",
  adminNote: string = "",
  adminId: string,
) => {
  const cafe = await findCafeById(cafeId);

  if (!cafe) {
    throw new NotFoundError("Cafe not found");
  }

  if (cafe.status === status) {
    throw new BadRequestError(`Cafe is already ${status}`);
  }

  return await updateCafeStatus(cafeId, status, adminNote, adminId);
};
