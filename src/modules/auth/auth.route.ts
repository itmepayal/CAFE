import { Router } from "express";
import {
  googleLoginController,
  appleLoginController,
  getCurrentUserController,
  logoutController,
} from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";

export const authRouter = Router();

/**
 * =========================================================
 * PUBLIC ROUTES
 * =========================================================
 */

authRouter.post("/google", googleLoginController);
authRouter.post("/apple", appleLoginController);

/**
 * =========================================================
 * PROTECTED ROUTES
 * =========================================================
 */
authRouter.get("/me", authenticate, getCurrentUserController);
authRouter.post("/logout", authenticate, logoutController);
