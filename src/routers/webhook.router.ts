import { Router } from "express";
import { handleCashfreeWebhookController } from "../modules/order/order.controller";

const cashfreeWebhookRouter = Router();

cashfreeWebhookRouter.post(
  "/cashfree",
  handleCashfreeWebhookController,
);

export default cashfreeWebhookRouter;
