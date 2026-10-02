import User, { IUser } from "../../models/user";
import {
  InternalServerError,
  NotFoundError,
  ConflictError,
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
  role?: "student" | "cafe_owner" | "admin" | "super_admin";
}

/**
 * =========================================================
 * CREATE APPLE USER PAYLOAD
 * =========================================================
 */
interface CreateAppleUserPayload {
  email?: string;
  providerId: string;
  role?: "student" | "cafe_owner" | "admin" | "super_admin";
}

export const findUserByProviderIdentity = async (
  provider: "google" | "apple",
  providerId: string,
): Promise<IUser | null> => {
  return User.findOne({ provider, providerId }).catch(() => {
    throw new InternalServerError("Failed to find user by provider identity");
  });
};

const resolveDuplicateOAuthCreate = async (
  error: unknown,
  provider: "google" | "apple",
  providerId: string,
): Promise<IUser> => {
  if ((error as { code?: number })?.code !== 11000) {
    throw error;
  }
  const existing = await findUserByProviderIdentity(provider, providerId);
  if (existing) return existing;
  throw new ConflictError("OAuth identity conflicts with an existing account");
};

/**
 * =========================================================
 * FIND USER BY EMAIL
 * =========================================================
 */
export const findUserByEmail = async (email: string): Promise<IUser | null> => {
  return User.findOne({ email: email.toLowerCase().trim() }).catch(() => {
    throw new InternalServerError("Failed to find user by email");
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
  const user = await User.findById(userId).catch(() => {
      throw new InternalServerError("Failed to fetch user");
    });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
};

/**
 * Lightweight user lookup for auth middleware (no populate).
 */
export const findUserAuthStatusById = async (
  userId: string,
): Promise<Pick<
  IUser,
  "_id" | "email" | "role" | "provider" | "isBlocked" | "isActive"
> | null> => {
  return User.findById(userId)
    .select("_id email role provider isBlocked isActive")
    .lean();
};

/**
 * =========================================================
 * CREATE GOOGLE USER
 * =========================================================
 */
export const createGoogleUser = async (
  payload: CreateGoogleUserPayload,
): Promise<IUser> => {
  try {
    return await User.create({
      name: payload.name,
      email: payload.email,
      profileImage: payload.profileImage,
      provider: "google",
      providerId: payload.providerId,
      role: payload.role,
      isEmailVerified: true,
    });
  } catch (error) {
    try {
      return await resolveDuplicateOAuthCreate(error, "google", payload.providerId);
    } catch (resolvedError) {
      if (resolvedError instanceof ConflictError) throw resolvedError;
      throw new InternalServerError("Failed to create Google user");
    }
  }
};

/**
 * =========================================================
 * CREATE APPLE USER
 * =========================================================
 */
export const createAppleUser = async (
  payload: CreateAppleUserPayload,
): Promise<IUser> => {
  try {
    return await User.create({
      name: "Apple User",
      email: payload.email || "",
      provider: "apple",
      providerId: payload.providerId,
      role: payload.role,
      isEmailVerified: true,
    });
  } catch (error) {
    try {
      return await resolveDuplicateOAuthCreate(error, "apple", payload.providerId);
    } catch (resolvedError) {
      if (resolvedError instanceof ConflictError) throw resolvedError;
      throw new InternalServerError("Failed to create Apple user");
    }
  }
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

/**
 * =========================================================
 * UPDATE PROFILE
 * =========================================================
 */
export const updateProfileRepo = async (
  userId: string,
  payload: Partial<IUser>,
): Promise<IUser> => {
  const user = await User.findOneAndUpdate(
    { _id: userId, isActive: true, isBlocked: false, deletedAt: null },
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!user) {
    throw new NotFoundError("User not found or unavailable");
  }

  return user;
};

export const createAdminGoogleUser = async (data: {
  name: string;
  email: string;
  profileImage?: string;
  providerId: string;
  role?: "super_admin" | "admin";
}): Promise<IUser> => {
  try {
    return await User.create({
      name: data.name,
      email: data.email,
      profileImage: data.profileImage,
      provider: "google",
      providerId: data.providerId,
      role: data.role ?? "admin",
      isBlocked: false,
    });
  } catch (error) {
    try {
      return await resolveDuplicateOAuthCreate(error, "google", data.providerId);
    } catch (resolvedError) {
      if (resolvedError instanceof ConflictError) throw resolvedError;
      throw new InternalServerError("Failed to create admin user");
    }
  }
};

export const createAdminAppleUser = async (data: {
  email: string;
  providerId: string;
  name?: string;
  role?: "super_admin" | "admin";
}): Promise<IUser> => {
  try {
    return await User.create({
      name: data.name ?? "Admin",
      email: data.email,
      provider: "apple",
      providerId: data.providerId,
      role: data.role ?? "admin",
      isBlocked: false,
    });
  } catch (error) {
    try {
      return await resolveDuplicateOAuthCreate(error, "apple", data.providerId);
    } catch (resolvedError) {
      if (resolvedError instanceof ConflictError) throw resolvedError;
      throw new InternalServerError("Failed to create admin user");
    }
  }
};

export const findUserByEmailWithPassword = async (
  email: string,
): Promise<IUser | null> => {
  return User.findOne({ email: email.toLowerCase().trim() })
    .select("+passwordHash")
    .catch(() => {
      throw new InternalServerError("Failed to find user");
    });
};

export const createAdminEmailUser = async (data: {
  name: string;
  email: string;
  passwordHash: string;
  role?: "super_admin" | "admin";
  bootstrapKey?: string;
}): Promise<IUser> => {
  const normalizedEmail = data.email.toLowerCase().trim();

  if (data.bootstrapKey) {
    // Fail closed if deployment has not materialized the schema index yet.
    try {
      await User.collection.createIndex(
        { bootstrapKey: 1 },
        { unique: true, sparse: true, name: "bootstrapKey_1" },
      );
    } catch {
      throw new InternalServerError("Failed to secure initial admin registration");
    }
  }

  return User.create({
    name: data.name.trim(),
    email: normalizedEmail,
    provider: "email",
    providerId: `email:${normalizedEmail}`,
    passwordHash: data.passwordHash,
    role: data.role ?? "admin",
    ...(data.bootstrapKey ? { bootstrapKey: data.bootstrapKey } : {}),
    isBlocked: false,
    isEmailVerified: true,
  }).catch((error: any) => {
    if (error?.code === 11000 && (error?.keyPattern?.bootstrapKey || error?.keyValue?.bootstrapKey)) {
      throw new ConflictError("Initial admin registration has already been claimed");
    }
    const duplicateEmail = error?.keyPattern?.email || error?.keyValue?.email;
    const duplicateEmailIdentity =
      (error?.keyPattern?.provider && error?.keyPattern?.providerId) &&
      (error?.keyValue?.provider === "email" || error?.keyValue?.providerId === `email:${normalizedEmail}`);
    if (error?.code === 11000 && (duplicateEmail || duplicateEmailIdentity)) {
      throw new ConflictError("An account with this email already exists");
    }
    throw new InternalServerError("Failed to create admin user");
  });
};
