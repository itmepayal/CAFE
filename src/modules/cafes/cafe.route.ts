import { Router } from "express";
import {
  registerCafeController,
  getApprovedCafesController,
  getMyCafeController,
  getCafeByIdController,
  getRegistrationDraftController,
  saveRegistrationDraftStepController,
  submitRegistrationDraftController,
  clearRegistrationDraftController,
} from "./cafe.controller";

import { upload } from "../../config/multer.config";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

import { registerCafeSchema, getCafeQuerySchema, draftStepParamsSchema, saveDraftStep1Schema, saveDraftStep2Schema, saveDraftStep3Schema, saveDraftStep4Schema, saveDraftStep5Schema, submitDraftSchema } from "./cafe.validation";

const cafeRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Cafe
 *   description: Cafe Management APIs
 */

/**
 * @swagger
 * /cafes:
 *   get:
 *     summary: Get all approved cafes
 *     tags: [Cafe]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Approved cafes fetched successfully
 */
cafeRouter.get("/", validate(getCafeQuerySchema), getApprovedCafesController);

/**
 * @swagger
 * /cafes/register:
 *   post:
 *     summary: Register a new cafe
 *     tags: [Cafe]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - cafeName
 *               - ownerName
 *               - mobile
 *               - aadharNumber
 *               - panNumber
 *               - fssaiNumber
 *               - accountHolderName
 *               - accountNumber
 *               - ifscCode
 *               - upiId
 *             properties:
 *               cafeName:
 *                 type: string
 *               ownerName:
 *                 type: string
 *               description:
 *                 type: string
 *               mobile:
 *                 type: string
 *               email:
 *                 type: string
 *               street:
 *                 type: string
 *               area:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               landmark:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               supportsDelivery:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *                 description: Whether the cafe provides delivery service.
 *               aadharNumber:
 *                 type: string
 *               panNumber:
 *                 type: string
 *               fssaiNumber:
 *                 type: string
 *               accountHolderName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               bankName:
 *                 type: string
 *               ifscCode:
 *                 type: string
 *               upiId:
 *                 type: string
 *               cafeImage:
 *                 type: string
 *                 format: binary
 *               menuImage:
 *                 type: string
 *                 format: binary
 *               gallery:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               layoutPhotos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               aadharPhoto:
 *                 type: string
 *                 format: binary
 *               panPhoto:
 *                 type: string
 *                 format: binary
 *               fssaiCertificate:
 *                 type: string
 *                 format: binary
 *               bankPassbookPhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Cafe registered successfully
 */
cafeRouter.post(
  "/register",
  authenticate,
  authorize("student", "super_admin"),
  upload.fields([
    { name: "cafeImage", maxCount: 1 },
    { name: "menuImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
    { name: "layoutPhotos", maxCount: 10 },
    { name: "aadharPhoto", maxCount: 1 },
    { name: "panPhoto", maxCount: 1 },
    { name: "fssaiCertificate", maxCount: 1 },
    { name: "bankPassbookPhoto", maxCount: 1 },
  ]),
  validate(registerCafeSchema),
  registerCafeController,
);

const draftUpload = upload.fields([
  { name: "cafeImage", maxCount: 1 },
  { name: "menuImage", maxCount: 1 },
  { name: "gallery", maxCount: 10 },
  { name: "layoutPhotos", maxCount: 10 },
  { name: "aadharPhoto", maxCount: 1 },
  { name: "panPhoto", maxCount: 1 },
  { name: "fssaiCertificate", maxCount: 1 },
  { name: "bankPassbookPhoto", maxCount: 1 },
]);

/**
 * @swagger
 * /cafes/register/draft:
 *   get:
 *     summary: Get cafe registration draft (multi-step onboarding)
 *     tags: [Cafe]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Draft fetched successfully
 */
cafeRouter.get(
  "/register/draft",
  authenticate,
  authorize("student", "super_admin"),
  getRegistrationDraftController,
);

/**
 * @swagger
 * /cafes/register/draft/{step}:
 *   put:
 *     summary: Save a registration draft step (1-4)
 *     tags: [Cafe]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: step
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *     responses:
 *       200:
 *         description: Draft step saved successfully
 */
cafeRouter.put(
  "/register/draft/:step",
  authenticate,
  authorize("student", "super_admin"),
  draftUpload,
  validate(draftStepParamsSchema),
  (req, res, next) => {
    const step = Number(req.params.step);
    const schemas = [
      saveDraftStep1Schema,
      saveDraftStep2Schema,
      saveDraftStep3Schema,
      saveDraftStep4Schema,
      saveDraftStep5Schema,
    ];
    const schema = schemas[step - 1];
    if (!schema) {
      res.status(400).json({ success: false, message: "Invalid step" });
      return;
    }
    validate(schema)(req, res, next);
  },
  saveRegistrationDraftStepController,
);

/**
 * @swagger
 * /cafes/register/draft/submit:
 *   post:
 *     summary: Submit completed registration draft for admin approval
 *     tags: [Cafe]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: Registration submitted successfully
 */
cafeRouter.post(
  "/register/draft/submit",
  authenticate,
  authorize("student", "super_admin"),
  validate(submitDraftSchema),
  submitRegistrationDraftController,
);

/**
 * @swagger
 * /cafes/register/draft:
 *   delete:
 *     summary: Clear registration draft
 *     tags: [Cafe]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Draft cleared successfully
 */
cafeRouter.delete(
  "/register/draft",
  authenticate,
  authorize("student", "super_admin"),
  clearRegistrationDraftController,
);

/**
 * @swagger
 * /cafes/my-cafe:
 *   get:
 *     summary: Get logged-in user's own cafe (with registration status)
 *     tags: [Cafe]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Own cafe fetched successfully
 */
cafeRouter.get("/my-cafe", authenticate, getMyCafeController);

/**
 * @swagger
 * /cafes/{id}:
 *   get:
 *     summary: Get cafe details by ID
 *     tags: [Cafe]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cafe details fetched successfully
 */
cafeRouter.get("/:id", getCafeByIdController);

export default cafeRouter;
