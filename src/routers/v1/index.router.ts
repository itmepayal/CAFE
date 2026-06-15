import express from "express";
import { authRouter } from "../../modules/auth/auth.route";
import complaintRouter from "../../modules/complaint/complaint.route";
import menuRouter from "../../modules/menu/menu.route";
import adminRouter from "../../modules/admin/admin.route";
import cafeRouter from "../../modules/cafes/cafe.route";
import ownerRouter from "../../modules/owner/owner.route";
import cartRouter from "../../modules/carts/cart.route";

const v1Router = express.Router();

v1Router.use("/auth", authRouter);
v1Router.use("/admin", adminRouter);
v1Router.use("/owners", ownerRouter);
v1Router.use("/menus", menuRouter);
v1Router.use("/cafes", cafeRouter);
v1Router.use("/carts", cartRouter);
v1Router.use("/complaints", complaintRouter);

export default v1Router;
