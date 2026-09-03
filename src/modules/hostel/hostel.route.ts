import { Router } from "express";
import { CAMPUS_HOSTELS } from "../../constants/hostels";

const hostelRouter = Router();

/**
 * @swagger
 * /hostels:
 *   get:
 *     summary: List campus hostels (student onboarding)
 *     tags: [Student Discovery]
 *     responses:
 *       200:
 *         description: Hostel list for Select Hostel screen
 */
hostelRouter.get("/", (_req, res) => {
  res.json({
    success: true,
    data: CAMPUS_HOSTELS,
  });
});

export default hostelRouter;
