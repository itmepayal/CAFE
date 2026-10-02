import { Request, Response } from "express";
import { asyncHandler } from "../../utils/handlers/async.handler";
import { extractRefreshToken } from "../../utils/auth/extract-token";
import { sendAuthResponse } from "../../utils/response/auth.response";
import { ApiResponse } from "../../utils/response/app.response";
import { serializeCurrentUser } from "../../utils/response/user.serializer";
import {
  UnauthorizedError,
} from "../../utils/errors/app.error";
import {
  googleLogin,
  appleLogin,
  getCurrentUser,
  changeProfile,
  refreshTokens,
  adminLogin,
  adminRegister,
  cafeOwnerLogin,
  logout,
  logoutAll,
  deleteAccount,
} from "./auth.service";

import { uploadToCloudinary } from "../../config/cloudinary.config";

export const googleLoginController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await googleLogin({ token: req.body.token });
    sendAuthResponse({
      res,
      message: "Google login successful",
      tokens: result,
    });
  },
);

export const appleLoginController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await appleLogin({ identityToken: req.body.identityToken });
    sendAuthResponse({
      res,
      message: "Apple login successful",
      tokens: result,
    });
  },
);

export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = await getCurrentUser(req.user!.id);
    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }
    ApiResponse.success(res, "Current user", serializeCurrentUser(user));
  },
);

export const logoutController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    await logout(req.user!.id, extractRefreshToken(req));
    ApiResponse.success(res, "Logout successful");
  },
);

export const changeProfileController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    let profileImage: string | undefined;

    if (req.file) {
      profileImage = await uploadToCloudinary(req.file.path, "users");
    }

    const user = await changeProfile(req.user!.id, {
      ...req.body,
      profileImage,
    });

    ApiResponse.success(res, "Profile updated successfully", serializeCurrentUser(user));
  },
);

export const logoutAllController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await logoutAll(req.user!.id);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    ApiResponse.success(res, "All sessions revoked", result);
  },
);

export const deleteAccountController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await deleteAccount(req.user!.id);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    ApiResponse.success(res, result.message);
  },
);
export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await refreshTokens({
      refreshToken: extractRefreshToken(req) ?? "",
    });

    sendAuthResponse({
      res,
      message: "Token refreshed successfully",
      tokens: result,
    });
  },
);

export const adminLoginController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await adminLogin({
      email: req.body.email,
      password: req.body.password,
    });

    sendAuthResponse({
      res,
      message: "Admin login successful",
      tokens: result,
      meta: {
        portal: "admin",
        redirectTo: "dashboard",
      },
    });
  },
);

export const adminRegisterController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await adminRegister({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      inviteToken: req.body.inviteToken,
    });

    sendAuthResponse({
      res,
      message: "Admin registration successful",
      tokens: result,
      statusCode: 201,
      meta: {
        portal: "admin",
        redirectTo: "dashboard",
      },
    });
  },
);

export const cafeOwnerLoginController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await cafeOwnerLogin({
      provider: req.body.provider,
      token: req.body.token,
      identityToken: req.body.identityToken,
    });

    sendAuthResponse({
      res,
      message: "Cafe owner login successful",
      tokens: result,
      meta: {
        ...result.meta,
      },
    });
  },
);
