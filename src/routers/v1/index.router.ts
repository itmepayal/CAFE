import express from "express";
import { authRouter } from "../../modules/auth/auth.route";
import complaintRouter from "../../modules/complaint/complaint.route";
import cafeRouter from "../../modules/cafes/cafe.route";

const v1Router = express.Router();

v1Router.use("/auth", authRouter);
v1Router.use("/cafes", cafeRouter);
v1Router.use("/complaints", complaintRouter);

export default v1Router;
