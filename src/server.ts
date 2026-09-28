import http from "http";
import mongoose from "mongoose";
import { connectDB } from "./config/db.config";
import logger from "./config/logger.config";
import { serverConfig } from "./config";
import { initializeSocket, getIO } from "./socket/socket";
import {
  startOrderAutoCancelJob,
  startSettlementAutoSettleJob,
  stopOrderJobs,
} from "./jobs/order.job";
import createApp from "./app";

const SHUTDOWN_TIMEOUT_MS = 15_000;

let httpServer: http.Server | null = null;
let shuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`Received ${signal} — starting graceful shutdown`);

  const forceTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref();

  try {
    stopOrderJobs();

    try {
      const io = getIO();
      await new Promise<void>((resolve) => {
        io.close(() => resolve());
      });
    } catch {
      // Socket may not be initialized
    }

    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer!.close((err) => (err ? reject(err) : resolve()));
      });
    }

    await mongoose.connection.close();
    logger.info("Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown", {
      error:
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error,
    });
    process.exit(1);
  }
};

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const app = createApp();

    httpServer = app.listen(serverConfig.PORT, "0.0.0.0", () => {
      logger.info(
        `Gravil Backend running on http://localhost:${serverConfig.PORT}`,
      );
      logger.info("Press Ctrl+C to stop the server.");
    });

    initializeSocket(httpServer);
    startOrderAutoCancelJob();
    startSettlementAutoSettleJob();

    httpServer.on("error", (error) => {
      logger.error("Server startup error", {
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
      });

      process.exit(1);
    });

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });
  } catch (error) {
    logger.error("Application startup failed", {
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    });

    process.exit(1);
  }
};

void startServer();
