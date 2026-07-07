import express from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { serverConfig } from "./config";
import logger from "./config/logger.config";
import { connectDB } from "./config/db.config";
import { swaggerSpec } from "./config/swagger.config";
import v1Router from "./routers/v1/index.router";
import {
  appErrorHandler,
  genericErrorHandler,
} from "./middlewares/error.middleware";
import { initializeSocket } from "./socket/socket";

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
app.use(cookieParser());

/**
 * =========================================================
 * CORS
 * =========================================================
 */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:19006",
  "https://cafe-6icu.onrender.com",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    logger.warn(`Blocked CORS Origin: ${origin}`);
    return callback(new Error("CORS not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

/**
 * =========================================================
 * REQUEST LOGGER
 * =========================================================
 */

app.use((req, _, next) => {
  logger.info(`GRAVIL BACKEND REQUEST => ${req.method} ${req.originalUrl}`);
  next();
});

/**
 * =========================================================
 * SWAGGER
 * =========================================================
 */
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      withCredentials: true,
    },
  }),
);

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
 * API ROUTES
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
    await connectDB();

    const server = app.listen(serverConfig.PORT, "0.0.0.0", () => {
      logger.info(
        `Gravil Backend running on http://localhost:${serverConfig.PORT}`,
      );
      logger.info("Press Ctrl+C to stop the server.");
    });

    initializeSocket(server);

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

void startServer();
