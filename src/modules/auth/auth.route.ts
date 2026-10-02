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
  logoutAllController,
  deleteAccountController,
} from "./auth.controller";

import { authenticate } from "../../middlewares/auth.middleware";
import { upload } from "../../config/multer.config";
import { validate } from "../../middlewares/validate.middleware";
import {
  authRateLimiter,
} from "../../middlewares/rate-limit.middleware";
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
 *     description: >
 *       Revokes the authenticated user's supplied refresh-token session and clears auth cookies.
 *       Access JWTs are stateless and remain valid until expiry; bearer-token clients must discard
 *       their access token locally.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Supplied refresh session is invalid, expired, or already revoked.
 */
authRouter.post("/logout", authenticate, logoutController);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Revoke all refresh sessions for the current user
 *     description: >
 *       Revokes all active refresh sessions owned by the authenticated user and clears current auth cookies.
 *       Access JWTs are stateless and remain valid until expiry, so other devices must discard them locally.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All sessions revoked
 *       401:
 *         description: Unauthorized
 */
authRouter.post("/logout-all", authenticate, logoutAllController);

/**
 * @swagger
 * /auth/account:
 *   delete:
 *     summary: Soft-delete and anonymize the authenticated account
 *     description: >
 *       Anonymizes PII, deactivates the user, and revokes sessions.
 *       Orders and payments are retained for financial integrity.
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Account anonymized
 *       400:
 *         description: Cannot delete (e.g. cafe owner with cafe)
 *       401:
 *         description: Unauthorized
 */
authRouter.delete("/account", authenticate, deleteAccountController);

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
 *                 example: "58321471"
 *                 description: 8-digit invite from POST /admin/invites or the configured ADMIN_BOOTSTRAP_TOKEN
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
 *     description: |
 *       Social Login
 *
 *       Supported providers use different authentication credentials:
 *
 *       Google:
 *       Send the Google ID Token in `token`.
 *
 *       Apple:
 *       Send the Apple Identity Token in `identityToken`.
 *
 *       Do not send both credentials unless explicitly required by the provider-specific implementation.
 *
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
 *             oneOf:
 *               - title: Google Login
 *                 type: object
 *                 required:
 *                   - provider
 *                   - token
 *                 properties:
 *                   provider:
 *                     type: string
 *                     enum:
 *                       - google
 *                   token:
 *                     type: string
 *                     example: "<GOOGLE_ID_TOKEN>"
 *                     description: |
 *                       Authentication credential used for Google login.
 *                       For provider=google, this field contains the Google ID Token verified by the backend.
 *                       Do not confuse this with an OAuth access token.
 *               - title: Apple Login
 *                 type: object
 *                 required:
 *                   - provider
 *                   - identityToken
 *                 properties:
 *                   provider:
 *                     type: string
 *                     enum:
 *                       - apple
 *                   identityToken:
 *                     type: string
 *                     example: "<APPLE_IDENTITY_TOKEN>"
 *                     description: |
 *                       Identity token used for Apple login.
 *                       For provider=apple, this field contains the Apple Identity Token verified by the backend.
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
