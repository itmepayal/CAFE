import cron from "node-cron";
import logger from "../config/logger.config";
import { autoCancelStaleOrdersService } from "../modules/owner/owner.service";
import Order from "../models/order";

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

export const cleanupStaleOrdersJob = async () => {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);

  try {
    const result = await Order.updateMany(
      {
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: { $ne: "cash" },
        createdAt: { $lt: cutoff },
      },
      {
        $set: {
          status: "cancelled",
          paymentStatus: "failed",
          cancelledBy: "system",
          cancellationReason: "Payment not completed within time window",
          cancelledAt: new Date(),
        },
        $push: {
          statusHistory: { status: "cancelled", changedAt: new Date() },
        },
      },
    );

    if (result.modifiedCount > 0) {
      logger.info("Stale unpaid orders auto-cancelled", {
        count: result.modifiedCount,
      });
    }
  } catch (error) {
    logger.error("Cleanup job failed", { error });
  }
};
