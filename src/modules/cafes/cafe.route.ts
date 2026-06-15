import { Router } from "express";
import {
  registerCafeController,
  getApprovedCafesController,
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

/* =========================================================
   PUBLIC
========================================================= */

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
 *         description: Search cafe by name
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter cafes by city
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

/* =========================================================
   STUDENT
========================================================= */

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
  authorize("student"),
  upload.fields([
    { name: "cafeImage", maxCount: 1 },
    { name: "menuImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
    { name: "aadharPhoto", maxCount: 1 },
    { name: "panPhoto", maxCount: 1 },
    { name: "fssaiCertificate", maxCount: 1 },
    { name: "bankPassbookPhoto", maxCount: 1 },
  ]),
  validate(registerCafeSchema),
  registerCafeController,
);

/* =========================================================
   PUBLIC
========================================================= */
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
