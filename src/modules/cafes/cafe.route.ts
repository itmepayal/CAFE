import { Router } from "express";
import {
  registerCafeController,
  getApprovedCafesController,
  getMyCafeController,
  getCafeByIdController,
} from "./cafe.controller";

import { upload } from "../../config/multer.config";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";

import { registerCafeSchema, getCafeQuerySchema } from "./cafe.validation";

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
 *     summary: List approved cafes (Home screen)
 *     description: Figma — Home cafe cards with rating and open status.
 *     tags: [Student Discovery]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search cafe name
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: isOpen
 *         schema:
 *           type: boolean
 *         description: Filter open cafes only
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudentCafeCard'
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
 *               - accountHolderName
 *               - accountNumber
 *               - confirmAccountNumber
 *               - ifscCode
 *               - ownerPhoto
 *               - layoutPhotos
 *               - shopEstablishmentCertificate
 *               - bankPassbookPhoto
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
 *               gstId:
 *                 type: string
 *                 description: Optional GST ID
 *               accountHolderName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               confirmAccountNumber:
 *                 type: string
 *               bankName:
 *                 type: string
 *               ifscCode:
 *                 type: string
 *               ownerPhoto:
 *                 type: string
 *                 format: binary
 *               layoutPhotos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               shopEstablishmentCertificate:
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
  authorize("student", "cafe_owner", "super_admin"),
  upload.fields([
    { name: "ownerPhoto", maxCount: 1 },
    { name: "layoutPhotos", maxCount: 10 },
    { name: "shopEstablishmentCertificate", maxCount: 1 },
    { name: "bankPassbookPhoto", maxCount: 1 },
  ]),
  validate(registerCafeSchema),
  registerCafeController,
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
