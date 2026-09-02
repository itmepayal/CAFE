import { Request, Response } from "express";
import { asyncHandler } from "../../utils/handlers/async.handler";
import { extractRefreshToken } from "../../utils/auth/extract-token";
import { sendAuthResponse } from "../../utils/response/auth.response";

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
    res.status(200).json({ success: true, data: user });
  },
);

export const logoutController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await logout(extractRefreshToken(req));
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logout successful" });
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

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
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
