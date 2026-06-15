import User from "../../models/user";
import {
  findAllComplaints,
  findCafeByIdRepo,
  findComplaintById,
  findPendingCafes,
  getAllUsersRepo,
  saveCafeRepo,
  saveUserRepo,
  updateComplaintStatus,
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

// =========================================
// GET ALL COMPLAINTS SERVICE
// =========================================
export const getAllComplaintsService = async (
  status?: string,
  category?: string,
  priority?: string,
  page?: number,
  limit?: number,
) => {
  return await findAllComplaints(status, category, priority, page, limit);
};

// =========================================
// GET COMPLAINT BY ID SERVICE
// =========================================
export const getComplaintByIdService = async (id: string) => {
  return await findComplaintById(id);
};

// =========================================
// UPDATE COMPLAINT STATUS SERVICE
// =========================================
export const updateComplaintStatusService = async (
  id: string,
  status: any,
  adminNote?: string,
  resolution?: string,
  assignedTo?: string,
  adminId?: string,
) => {
  return await updateComplaintStatus(
    id,
    status,
    adminNote,
    resolution,
    assignedTo,
    adminId,
  );
};
