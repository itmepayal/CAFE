import express from "express";
import { serverConfig } from "./config";
import logger from "./config/logger.config";
import { connectDB } from "./config/db.config";
import v1Router from "./routers/v1/index.router";
import {
  appErrorHandler,
  genericErrorHandler,
} from "./middlewares/error.middleware";

/**
 * =========================================================
 * EXPRESS APP
 * =========================================================
 */
const app = express();

/**
 * =========================================================
 * MIDDLEWARES
 * =========================================================
 */
app.use(express.json());

app.use((req, _, next) => {
  logger.info(`GRAVIL BACKEND REQUEST => ${req.method} ${req.url}`);
  next();
});

/**
 * =========================================================
 * HEALTH CHECK
 * =========================================================
 */

app.get("/health", (_, res) => {
  res.status(200).json({
    success: true,
    message: "Gravil Backend Running Successfully",
  });
});

/**
 * =========================================================
 * ROUTES
 * =========================================================
 */

app.use("/api/v1", v1Router);

/**
 * =========================================================
 * ERROR HANDLERS
 * =========================================================
 */

app.use(appErrorHandler);
app.use(genericErrorHandler);

/**
 * =========================================================
 * START SERVER
 * =========================================================
 */

const startServer = async (): Promise<void> => {
  try {
    /**
     * =====================================================
     * DATABASE CONNECTION
     * =====================================================
     */

    await connectDB();

    /**
     * =====================================================
     * START EXPRESS SERVER
     * =====================================================
     */

    const server = app.listen(serverConfig.PORT, () => {
      logger.info(
        `Auth Service running on http://localhost:${serverConfig.PORT}`,
      );

      logger.info("Press Ctrl+C to stop the server.");
    });

    /**
     * =====================================================
     * SERVER EVENTS
     * =====================================================
     */

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

    logger.info(`SERVER LISTENING => ${server.listening}`);

    logger.info("SERVER FILE EXECUTED");
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

/**
 * =========================================================
 * INITIALIZE SERVER
 * =========================================================
 */

void startServer();
