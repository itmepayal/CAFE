import User, { IUser } from "../../models/user";
import {
  InternalServerError,
  NotFoundError,
} from "../../utils/errors/app.error";

/**
 * =========================================================
 * CREATE GOOGLE USER PAYLOAD
 * =========================================================
 */
interface CreateGoogleUserPayload {
  name?: string;
  email?: string;
  profileImage?: string;
  providerId: string;
}

/**
 * =========================================================
 * CREATE APPLE USER PAYLOAD
 * =========================================================
 */
interface CreateAppleUserPayload {
  email?: string;
  providerId: string;
}

/**
 * =========================================================
 * FIND USER BY PROVIDER ID OR EMAIL
 * =========================================================
 */
export const findUserByProviderIdOrEmail = async (
  providerId: string,
  email?: string,
): Promise<IUser | null> => {
  return User.findOne({
    $or: [{ providerId }, { email }],
  }).catch(() => {
    throw new InternalServerError("Failed to find user");
  });
};

/**
 * =========================================================
 * FIND USER BY PROVIDER ID
 * =========================================================
 */
export const findUserByProviderId = async (
  providerId: string,
): Promise<IUser | null> => {
  return User.findOne({
    providerId,
  }).catch(() => {
    throw new InternalServerError("Failed to find user");
  });
};

/**
 * =========================================================
 * FIND USER BY ID
 * =========================================================
 */
export const findUserById = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId)
    .populate("ownedCafe")
    .populate("favoriteCafes")
    .catch(() => {
      throw new InternalServerError("Failed to fetch user");
    });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
};

/**
 * =========================================================
 * CREATE GOOGLE USER
 * =========================================================
 */
export const createGoogleUser = async (
  payload: CreateGoogleUserPayload,
): Promise<IUser> => {
  return User.create({
    name: payload.name,
    email: payload.email,
    profileImage: payload.profileImage,

    provider: "google",
    providerId: payload.providerId,

    isEmailVerified: true,
  }).catch(() => {
    throw new InternalServerError("Failed to create Google user");
  });
};

/**
 * =========================================================
 * CREATE APPLE USER
 * =========================================================
 */
export const createAppleUser = async (
  payload: CreateAppleUserPayload,
): Promise<IUser> => {
  return User.create({
    name: "Apple User",

    email: payload.email || "",

    provider: "apple",
    providerId: payload.providerId,

    isEmailVerified: true,
  }).catch(() => {
    throw new InternalServerError("Failed to create Apple user");
  });
};

/**
 * =========================================================
 * UPDATE USER SESSION
 * =========================================================
 */
export const updateUserSession = async (user: IUser): Promise<IUser> => {
  user.lastLoginAt = new Date();
  user.loginCount += 1;

  return user.save().catch(() => {
    throw new InternalServerError("Failed to update user session");
  });
};
