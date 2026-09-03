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
  cafeOwnerLoginController,
} from "./auth.controller";

import { authenticate } from "../../middlewares/auth.middleware";
import { upload } from "../../config/multer.config";
import { validate } from "../../middlewares/validate.middleware";
import { authRateLimiter } from "../../middlewares/rate-limit.middleware";
import {
  updateProfileSchema,
  googleLoginSchema,
  appleLoginSchema,
  adminEmailLoginSchema,
  adminEmailRegisterSchema,
  cafeOwnerLoginSchema,
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
 *     description: Figma — Continue with Google on Student Sign In screen.
 *     tags: [Student Auth]
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
 *     description: Figma — Continue with Apple on Student Sign In screen.
 *     tags: [Student Auth]
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
 *     summary: Get current student profile
 *     description: Figma — Profile tab header (name, email, avatar).
 *     tags: [Student Profile]
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
 *     summary: Update student profile
 *     description: Figma — Personal Information (name, phone, university, hostel).
 *     tags: [Student Profile]
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
 *               hostel:
 *                 type: string
 *                 example: Boys Hostel A
 *                 description: Figma — Select Hostel screen
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
  validate(updateProfileSchema),
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
 *     summary: Register super admin with email and password (Figma Admin screen)
 *     description: >
 *       Creates a super_admin account using email and password.
 *       Requires inviteToken from POST /admin/invites or ADMIN_BOOTSTRAP_TOKEN for first admin.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, inviteToken]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Admin User
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@gravly.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123
 *               inviteToken:
 *                 type: string
 *                 description: From POST /admin/invites or ADMIN_BOOTSTRAP_TOKEN
 *     responses:
 *       201:
 *         description: Admin registered and logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       409:
 *         description: Email already exists
 */
authRouter.post(
  "/admin/register",
  validate(adminEmailRegisterSchema),
  adminRegisterController,
);

/**
 * @swagger
 * /auth/admin/login:
 *   post:
 *     summary: Super Admin login with email and password (Figma Admin screen)
 *     description: >
 *       Authenticates an existing super_admin using email and password.
 *       Returns JWT accessToken for Bearer auth on all /admin/* routes.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@gravly.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123
 *     responses:
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokenResponse'
 *       401:
 *         description: Invalid credentials or not a super_admin
 */
authRouter.post(
  "/admin/login",
  validate(adminEmailLoginSchema),
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
 *         description: Cafe owner login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     accessToken:
 *                       type: string
 *                     portal:
 *                       type: string
 *                       example: cafe_owner
 *                     redirectTo:
 *                       type: string
 *                       enum: [register_cafe, pending_approval, rejected, dashboard]
 *                     cafeStatus:
 *                       type: string
 *                       enum: [not_registered, pending, rejected, approved]
 *                     cafeId:
 *                       type: string
 *       401:
 *         description: Invalid token or user used the wrong portal
 */
authRouter.post(
  "/cafe-owner/login",
  validate(cafeOwnerLoginSchema),
  cafeOwnerLoginController,
);
