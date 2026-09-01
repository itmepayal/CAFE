import express from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import { serverConfig } from "./config";
import logger from "./config/logger.config";
import { swaggerSpec } from "./config/swagger.config";
import v1Router from "./routers/v1/index.router";
import cashfreeWebhookRouter from "./routers/webhook.router";
import {
  appErrorHandler,
  genericErrorHandler,
} from "./middlewares/error.middleware";
import { applySecurityMiddleware } from "./middlewares/security.middleware";
import { generalRateLimiter } from "./middlewares/rate-limit.middleware";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:8000",
  "https://cafe-6icu.onrender.com",
  "https://cafe-myg2.onrender.com",
  "https://gravity-task-management-system.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // No Origin: mobile apps, webhooks, health checks, server-to-server (not browser CORS)
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

export const createApp = (): express.Application => {
  const app = express();

  applySecurityMiddleware(app);

  app.get("/health", (_req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;

    res.status(dbConnected ? 200 : 503).json({
      success: dbConnected,
      message: dbConnected
        ? "Gravil Backend Running Successfully"
        : "Database unavailable",
      database: dbConnected ? "connected" : "disconnected",
    });
  });

  app.use(
    "/api/v1/orders/webhook",
    express.raw({ type: "application/json" }),
    cashfreeWebhookRouter,
  );

  app.use(cookieParser());

  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));

  app.use(generalRateLimiter);

  app.use((req, _res, next) => {
    logger.info(`GRAVIL BACKEND REQUEST => ${req.method} ${req.originalUrl}`);
    next();
  });

  app.use(express.json());

  if (serverConfig.NODE_ENV !== "production") {
    app.use(
      "/docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        swaggerOptions: {
          withCredentials: true,
        },
      }),
    );
  }

  app.use("/api/v1", v1Router);

  app.use(appErrorHandler);
  app.use(genericErrorHandler);

  return app;
};

export default createApp;
