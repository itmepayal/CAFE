import mongoose from "mongoose";
import User from "../../models/user";
import { ICafe } from "../../models/cafe";
import {
  createCafe,
  findApprovedCafes,
  findPublicCafeById,
  findCafeByUserId,
  findMyCafeByOwnerId,
  hasActiveUndeletedAccount,
  updatedCafe,
} from "./cafe.repository";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../../utils/errors/app.error";
import { logger } from "../../config/logger.config";
import { emitAdminCafeRequest } from "../../socket/admin";

const pendingState = (payload: any) => ({
  status: "pending",
  isBlocked: false,
  isVisible: false,
  isOpen: false,
  isFeatured: false,
  supportsDelivery: payload.supportsDelivery ?? false,
});

// =========================================
// REGISTER CAFE
// =========================================
export const registerCafeService = async (userId: string, payload: any) => {
  logger.info(`Registering cafe for user ${userId}`);
  const mongoSession = await mongoose.startSession();
  let cafe: ICafe | null = null;
  try {
    cafe = await mongoSession.withTransaction(async () => {
      const owner = await User.findOne({
        _id: userId,
        role: { $in: ["student", "cafe_owner", "super_admin"] },
        isActive: true,
        isBlocked: false,
        deletedAt: null,
      }).session(mongoSession);

      if (!owner) {
        throw new ForbiddenError("An active account is required to register a cafe");
      }

      const existingCafe = await findCafeByUserId(userId, mongoSession);
      if (existingCafe) {
        if (existingCafe.status !== "rejected") {
          throw new ConflictError("Cafe already registered for this user");
        }

        const updated = await updatedCafe(existingCafe._id.toString(), {
          ...payload,
          userId,
          ...pendingState(payload),
          adminNote: "",
          rejectedAt: null,
          approvedAt: null,
          approvedBy: null,
        }, mongoSession);

        if (!updated) {
          throw new BadRequestError("Failed to re-submit cafe registration");
        }

        owner.ownedCafe = updated._id;
        await owner.save({ session: mongoSession });
        return updated;
      }

      const created = await createCafe({
        ...payload,
        userId,
        ...pendingState(payload),
      }, mongoSession);


      owner.ownedCafe = created._id;
      await owner.save({ session: mongoSession });
      return created;
    });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      throw new ConflictError("Cafe already registered for this user");
    }
    throw error;
  } finally {
    await mongoSession.endSession();
  }

  if (!cafe) throw new InternalServerError("Cafe registration transaction returned no cafe");
  logger.info(`Cafe registered with id: ${cafe._id} (pending admin approval)`);
  emitAdminCafeRequest(cafe);
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
  isOpen?: boolean,
) => {
  logger.info(
    `Fetching approved cafes (search: ${search ?? "none"}, city: ${city ?? "none"
    }, isOpen: ${isOpen ?? "any"}, page: ${page}, limit: ${limit})`,
  );

  return await findApprovedCafes(search, city, page, limit, isOpen);
};

// =========================================
// GET CAFE BY ID
// =========================================
export const getCafeByIdService = async (id: string) => {
  logger.info(`Fetching cafe by id: ${id}`);

  const cafe = await findPublicCafeById(id);

  if (!cafe) {
    logger.warn(`Cafe not found: ${id}`);
    throw new NotFoundError("Cafe not found");
  }

  if (
    cafe.status !== "approved" ||
    !cafe.isVisible ||
    cafe.isBlocked
  ) {
    throw new NotFoundError("Cafe not found");
  }

  return cafe;
};

// =========================================
// GET MY CAFE
// =========================================
export const getMyCafeService = async (userId: string) => {
  logger.info(`Fetching own cafe for user ${userId}`);

  if (!await hasActiveUndeletedAccount(userId)) {
    throw new ForbiddenError("An active account is required to view its cafe");
  }

  const cafe = await findMyCafeByOwnerId(userId);

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
    };
  }

  if (cafe.status !== "approved") {
    throw new InternalServerError("Cafe registration has an invalid status");
  }

  // Defense in depth: never serialize the whole database model to the owner API.
  return {
    _id: cafe._id,
    cafeName: cafe.cafeName,
    ownerName: cafe.ownerName,
    description: cafe.description,
    mobile: cafe.mobile,
    email: cafe.email,
    address: cafe.address,
    location: cafe.location,
    cafeImage: cafe.cafeImage,
    menuImage: cafe.menuImage,
    gallery: cafe.gallery,
    layoutPhotos: cafe.layoutPhotos,
    interiorPhotos: cafe.interiorPhotos,
    exteriorPhotos: cafe.exteriorPhotos,
    socialMedia: cafe.socialMedia,
    isOpen: cafe.isOpen,
    isVisible: cafe.isVisible,
    isFeatured: cafe.isFeatured,
    supportsDelivery: cafe.supportsDelivery,
    status: cafe.status,
    registrationFeedback: cafe.registrationFeedback,
    rating: cafe.rating,
    createdAt: cafe.createdAt,
    updatedAt: cafe.updatedAt,
  };
};
