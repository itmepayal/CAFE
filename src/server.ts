import { connectDB } from "./config/db.config";
import logger from "./config/logger.config";
import { serverConfig } from "./config";
import { initializeSocket } from "./socket/socket";
import { startOrderAutoCancelJob } from "./jobs/order.job";
import createApp from "./app";

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const app = createApp();

    const server = app.listen(serverConfig.PORT, "0.0.0.0", () => {
      logger.info(
        `Gravil Backend running on http://localhost:${serverConfig.PORT}`,
      );
      logger.info("Press Ctrl+C to stop the server.");
    });

    initializeSocket(server);
    startOrderAutoCancelJob();

    server.on("error", (error) => {
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
