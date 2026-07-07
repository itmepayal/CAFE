import cron from "node-cron";
import logger from "../config/logger.config";
import { autoCancelStaleOrdersService } from "../modules/owner/owner.service";

export const startOrderAutoCancelJob = (): void => {
  cron.schedule("*/2 * * * *", async () => {
    try {
      await autoCancelStaleOrdersService();
    } catch (error) {
      logger.error("Order auto-cancel job failed", { error });
    }
  });

  logger.info("Order auto-cancel cron job scheduled (every 2 minutes)");
};
