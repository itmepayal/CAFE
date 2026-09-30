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
import {
  validateAndConsumeAdminInvite,
  markInviteUsedBy,
} from "../admin/admin-invite.service";
import { emitAdminUserRegistered } from "../../socket/admin";

export const verifyProviderToken = async (
  provider: Provider,
  token?: string,
  identityToken?: string,
): Promise<ProviderProfile> => {
  if (provider === "google") {
    const idToken = identityToken || token;
    if (!idToken) {
      throw new UnauthorizedError("Google identity token missing");
    }

    const googleUser = await verifyGoogleToken(idToken).catch((err) => {
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

export const findOrCreateUser = async (
  profile: ProviderProfile,
  role: "student" | "cafe_owner" = "student"
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
    `Creating new ${role} via ${profile.provider} login: ${profile.email}`,
  );

  if (profile.provider === "google") {
    user = await createGoogleUser({
      name: profile.name ?? "User",
      email: profile.email,
      profileImage: profile.profileImage,
      providerId: profile.providerId,
      role,
    });
  } else {
    user = await createAppleUser({
      email: profile.email,
      providerId: profile.providerId,
      role,
    });
  }

  emitAdminUserRegistered({
    userId: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    provider: user.provider,
  });

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
  const user = await findOrCreateUser(profile, "student");
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
  role: "super_admin" | "admin"
): Promise<IUser> => {
  let user = await findExistingUser(profile);

  if (user) {
    if (user.role !== role) {
      user.role = role;
      await user.save();
    }

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
    `Creating new ${role} via ${profile.provider}: ${profile.email}`,
  );

  if (profile.provider === "google") {
    user = await createAdminGoogleUser({
      name: profile.name ?? "Admin",
      email: profile.email,
      profileImage: profile.profileImage,
      providerId: profile.providerId,
      role,
    });
  } else {
    user = await createAdminAppleUser({
      email: profile.email,
      providerId: profile.providerId,
      name: profile.name,
      role,
    });
  }

  return user;
};

export const loginAdminWithProvider = async (
  provider: Provider,
  token?: string,
  identityToken?: string,
  inviteToken?: string,
): Promise<AuthTokensResult> => {
  const profile = await verifyProviderToken(provider, token, identityToken);
  const existingUser = await findExistingUser(profile);

  if (existingUser) {
    if (
      existingUser.provider !== profile.provider &&
      existingUser.providerId !== profile.providerId
    ) {
      throw new ConflictError(
        `This email is already registered with ${existingUser.provider}. Please sign in using ${existingUser.provider}.`,
      );
    }
    return authenticateUser(existingUser, { expectedRole: "super_admin" });
  }

  if (!inviteToken) {
    throw new UnauthorizedError(
      "Admin account not found. Super admin accounts are provisioned by the system administrator.",
    );
  }

  const { isBootstrap } = await validateAndConsumeAdminInvite(inviteToken, profile.email);
  const expectedRole = isBootstrap ? "super_admin" : "admin";

  const user = await findOrCreateAdmin(profile, expectedRole);
  await markInviteUsedBy(inviteToken, user._id.toString());

  return authenticateUser(user, { expectedRole });
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

  const user = await findOrCreateUser(profile, "cafe_owner");
  return authenticateUser(user);
};
