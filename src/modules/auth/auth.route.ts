import { Router } from "express";

import {
  googleLoginController,
  appleLoginController,
  getCurrentUserController,
  logoutController,
  changeProfileController,
  refreshTokenController,
  adminLoginController,
  adminRegisterController,
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
 * /auth/admin/register:
 *   post:
 *     summary: Register as admin using Google or Apple
 *     description: >
 *       Creates a new admin account using Google or Apple authentication.
 *       The created user is assigned the super_admin role by the server.
 *       The role is never accepted from the client.
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
 *       201:
 *         description: Admin registration successful and cookies set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin registration successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 665c12345678901234567890
 *                         name:
 *                           type: string
 *                           example: Payal Patel
 *                         email:
 *                           type: string
 *                           example: admin@example.com
 *                         role:
 *                           type: string
 *                           example: super_admin
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIs...
 *                     refreshToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIs...
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid provider token, missing email, or unsupported provider
 *       409:
 *         description: Account already exists
 */
authRouter.post("/admin/register", adminRegisterController);

/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     summary: Login as admin using Google or Apple
 *     description: >
 *       Authenticates an existing user using Google or Apple.
 *       Login is allowed only when the user's role is super_admin.
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
authRouter.post("/admin/login", adminLoginController);
