import { Request, Response } from "express";
import { asyncHandler } from "../../utils/handlers/async.handler";
import { googleLogin, appleLogin, getCurrentUser } from "./auth.service";
import { setAuthCookies } from "../../utils/cookies/cookie.utils";

/**
 * =========================================================
 * GOOGLE LOGIN
 * =========================================================
 */
export const googleLoginController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;

    const result = await googleLogin({
      token,
    });

    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    res.status(200).json({
      success: true,
      message: "Google login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  },
);

/**
 * =========================================================
 * APPLE LOGIN
 * =========================================================
 */
export const appleLoginController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { identityToken } = req.body;

    const result = await appleLogin({
      identityToken,
    });

    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    res.status(200).json({
      success: true,
      message: "Apple login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
    });
  },
);

/**
 * =========================================================
 * GET CURRENT USER
 * =========================================================
 */
export const getCurrentUserController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id as string;
    const user = await getCurrentUser(userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  },
);

/**
 * =========================================================
 * LOGOUT
 * =========================================================
 */
export const logoutController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  },
);
