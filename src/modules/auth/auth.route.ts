import { Router } from "express";
import {
  googleLoginController,
  appleLoginController,
  getCurrentUserController,
  logoutController,
  changeProfileController,
} from "./auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { upload } from "../../config/multer.config";

export const authRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Login with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJSUzI1NiIs...
 *     responses:
 *       200:
 *         description: Login successful and cookies set
 *       401:
 *         description: Invalid Google token
 */
authRouter.post("/google", googleLoginController);

/**
 * @swagger
 * /auth/apple:
 *   post:
 *     summary: Login with Apple
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identityToken
 *             properties:
 *               identityToken:
 *                 type: string
 *                 example: eyJraWQiOiJ...
 *     responses:
 *       200:
 *         description: Login successful and cookies set
 *       401:
 *         description: Invalid Apple token
 */
authRouter.post("/apple", appleLoginController);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *       401:
 *         description: Unauthorized
 */
authRouter.get("/me", authenticate, getCurrentUserController);

/**
 * @swagger
 * /auth/profile:
 *   patch:
 *     summary: Update logged-in user's profile
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Payal Patel
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               university:
 *                 type: string
 *                 example: Nirma University
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
authRouter.patch(
  "/profile",
  authenticate,
  upload.single("profileImage"),
  changeProfileController,
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
authRouter.post("/logout", authenticate, logoutController);
