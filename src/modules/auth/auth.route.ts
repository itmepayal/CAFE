import { Router } from "express";

import {
  googleLoginController,
  appleLoginController,
  getCurrentUserController,
  logoutController,
  changeProfileController,
  refreshTokenController,
  adminLoginController,
  cafeOwnerLoginController,
} from "./auth.controller";

import { authenticate } from "../../middlewares/auth.middleware";
import { upload } from "../../config/multer.config";
import { validate } from "../../middlewares/validate.middleware";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware";
import {
  googleLoginSchema,
  appleLoginSchema,
  adminLoginSchema,
} from "./auth.validation";

export const authRouter = Router();

authRouter.use(authRateLimiter);

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
 *     summary: Login or sign up as student with Google
 *     description: >
 *       Verifies Google ID token and auto-registers a new student if the account does not exist.
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
authRouter.post("/google", validate(googleLoginSchema), googleLoginController);

/**
 * @swagger
 * /auth/apple:
 *   post:
 *     summary: Login or sign up as student with Apple
 *     description: >
 *       Verifies Apple identity token and auto-registers a new student if the account does not exist.
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
authRouter.post("/apple", validate(appleLoginSchema), appleLoginController);

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

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access and refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIs...
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
authRouter.post("/refresh-token", refreshTokenController);

/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     summary: Login or sign up as super admin using Google or Apple
 *     description: >
 *       Verifies Google or Apple token and auto-registers a new super_admin if the account
 *       does not exist. Existing super_admin accounts are logged in directly.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *                 enum:
 *                   - google
 *                   - apple
 *                 example: google
 *               token:
 *                 type: string
 *                 description: Required when provider is "google"
 *                 example: eyJhbGciOiJSUzI1NiIs...
 *               identityToken:
 *                 type: string
 *                 description: Required when provider is "apple"
 *                 example: eyJraWQiOiJ...
 *     responses:
 *       200:
 *         description: Admin login successful and cookies set
 *       401:
 *         description: Invalid token or user is not a super_admin
 */
authRouter.post(
  "/admin/login",
  validate(adminLoginSchema),
  adminLoginController,
);

/**
 * @swagger
 * /auth/cafe-owner/login:
 *   post:
 *     summary: Login or sign up as cafe owner using Google or Apple
 *     description: >
 *       Verifies Google or Apple token and auto-registers a new student account if the user
 *       does not exist. Existing cafe_owner and student accounts are logged in directly.
 *       After sign-up, complete cafe registration via POST /cafes/register. Admin approval
 *       promotes the user to cafe_owner via PATCH /admin/cafes/{id}/approve.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *                 enum:
 *                   - google
 *                   - apple
 *               token:
 *                 type: string
 *                 description: Required when provider is "google"
 *               identityToken:
 *                 type: string
 *                 description: Required when provider is "apple"
 *     responses:
 *       200:
 *         description: Cafe owner login successful and cookies set
 *       401:
 *         description: Invalid token or user used the wrong portal
 */
authRouter.post(
  "/cafe-owner/login",
  validate(adminLoginSchema),
  cafeOwnerLoginController,
);
