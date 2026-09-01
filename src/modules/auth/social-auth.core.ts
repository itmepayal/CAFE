import { IUser } from "../../models/user";
import { verifyGoogleToken } from "../../providers/google.provider";
import { verifyAppleToken } from "../../providers/apple.provider";
import { UnauthorizedError, ConflictError } from "../../utils/errors/app.error";
import { logger } from "../../config/logger.config";
import {
  findUserByProviderIdOrEmail,
  createGoogleUser,
  createAppleUser,
  createAdminGoogleUser,
  createAdminAppleUser,
  updateUserSession,
} from "./auth.repository";
import { issueAuthTokens, AuthTokensResult } from "./auth.tokens";
import { ExpectedRole, Provider, ProviderProfile } from "./auth.type";

export const verifyProviderToken = async (
  provider: Provider,
  token?: string,
  identityToken?: string,
): Promise<ProviderProfile> => {
  if (provider === "google") {
    if (!token) {
      throw new UnauthorizedError("Google token missing");
    }

    const googleUser = await verifyGoogleToken(token).catch((err) => {
      logger.warn(`Google token verification failed: ${err?.message}`);
      throw new UnauthorizedError("Invalid Google token");
    });

    if (!googleUser.email) {
      throw new UnauthorizedError("Email not provided by Google");
    }

    return {
      provider: "google",
      providerId: googleUser.providerId,
      email: googleUser.email,
      name: googleUser.name ?? "User",
      profileImage: googleUser.profileImage,
    };
  }

  if (provider === "apple") {
    if (!identityToken) {
      throw new UnauthorizedError("Apple identity token missing");
    }

    const appleUser = await verifyAppleToken(identityToken).catch((err) => {
      logger.warn(`Apple token verification failed: ${err?.message}`);
      throw new UnauthorizedError("Invalid Apple token");
    });

    if (!appleUser.email) {
      throw new UnauthorizedError("Email not provided by Apple");
    }

    return {
      provider: "apple",
      providerId: appleUser.providerId,
      email: appleUser.email,
      name: "Apple User",
      profileImage: undefined,
    };
  }

  throw new UnauthorizedError("Unsupported login provider");
};

export const findExistingUser = async (
  profile: ProviderProfile,
): Promise<IUser | null> => {
  return findUserByProviderIdOrEmail(profile.providerId, profile.email);
};

export const findOrCreateStudent = async (
  profile: ProviderProfile,
): Promise<IUser> => {
  let user = await findExistingUser(profile);

  if (user) {
    if (
      user.provider !== profile.provider &&
      user.providerId !== profile.providerId
    ) {
      throw new ConflictError(
        `This email is already registered with ${user.provider}. Please sign in using ${user.provider}.`,
      );
    }

    return user;
  }

  logger.info(
    `Creating new student via ${profile.provider} login: ${profile.email}`,
  );

  if (profile.provider === "google") {
    user = await createGoogleUser({
      name: profile.name ?? "User",
      email: profile.email,
      profileImage: profile.profileImage,
      providerId: profile.providerId,
    });
  } else {
    user = await createAppleUser({
      email: profile.email,
      providerId: profile.providerId,
    });
  }

  return user;
};

interface AuthenticateUserOptions {
  expectedRole?: ExpectedRole;
}

export const authenticateUser = async (
  user: IUser,
  options?: AuthenticateUserOptions,
): Promise<AuthTokensResult> => {
  if (user.isBlocked) {
    logger.warn(`Blocked user attempted login: ${user._id}`);
    throw new UnauthorizedError("Account blocked");
  }

  if (options?.expectedRole && user.role !== options.expectedRole) {
    logger.warn(
      `Role mismatch on login: expected ${options.expectedRole}, got ${user.role} for user ${user._id}`,
    );

    const message =
      options.expectedRole === "super_admin"
        ? "Admin access required"
        : "Cafe owner access required";

    throw new UnauthorizedError(message);
  }

  const updatedUser = await updateUserSession(user);
  return issueAuthTokens(updatedUser);
};

export const loginWithProvider = async (
  provider: Provider,
  token?: string,
  identityToken?: string,
  options?: AuthenticateUserOptions,
): Promise<AuthTokensResult> => {
  const profile = await verifyProviderToken(provider, token, identityToken);
  const user = await findOrCreateStudent(profile);
  return authenticateUser(user, options);
};

export const loginExistingUserWithProvider = async (
  provider: Provider,
  token?: string,
  identityToken?: string,
  options?: AuthenticateUserOptions,
): Promise<AuthTokensResult> => {
  const profile = await verifyProviderToken(provider, token, identityToken);
  const user = await findExistingUser(profile);

  if (!user) {
    throw new UnauthorizedError("Account not found. Please register first.");
  }

  return authenticateUser(user, options);
};

export const findOrCreateAdmin = async (
  profile: ProviderProfile,
): Promise<IUser> => {
  let user = await findExistingUser(profile);

  if (user) {
    if (
      user.provider !== profile.provider &&
      user.providerId !== profile.providerId
    ) {
      throw new ConflictError(
        `This email is already registered with ${user.provider}. Please sign in using ${user.provider}.`,
      );
    }

    return user;
  }

  logger.info(
    `Creating new super_admin via ${profile.provider} login: ${profile.email}`,
  );

  if (profile.provider === "google") {
    user = await createAdminGoogleUser({
      name: profile.name ?? "Admin",
      email: profile.email,
      profileImage: profile.profileImage,
      providerId: profile.providerId,
    });
  } else {
    user = await createAdminAppleUser({
      email: profile.email,
      providerId: profile.providerId,
      name: profile.name,
    });
  }

  return user;
};

export const loginOrSignUpAdminWithProvider = async (
  provider: Provider,
  token?: string,
  identityToken?: string,
): Promise<AuthTokensResult> => {
  const profile = await verifyProviderToken(provider, token, identityToken);
  const user = await findOrCreateAdmin(profile);
  return authenticateUser(user, { expectedRole: "super_admin" });
};

export const loginOrSignUpCafeOwnerWithProvider = async (
  provider: Provider,
  token?: string,
  identityToken?: string,
): Promise<AuthTokensResult> => {
  const profile = await verifyProviderToken(provider, token, identityToken);
  const existingUser = await findExistingUser(profile);

  if (existingUser) {
    if (existingUser.role === "super_admin") {
      throw new UnauthorizedError("Please use the admin login portal");
    }

    return authenticateUser(existingUser);
  }

  const user = await findOrCreateStudent(profile);
  return authenticateUser(user);
};
