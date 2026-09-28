import express from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import mongoose from "mongoose";
import logger from "./config/logger.config";
import { swaggerSpec } from "./config/swagger.config";
import v1Router from "./routers/v1/index.router";
import cashfreeWebhookRouter from "./routers/webhook.router";
import {
  appErrorHandler,
  genericErrorHandler,
} from "./middlewares/error.middleware";
import {
  applySecurityMiddleware,
  swaggerCspMiddleware,
} from "./middlewares/security.middleware";
import { generalRateLimiter } from "./middlewares/rate-limit.middleware";
import { swaggerAccessGuard } from "./middlewares/swagger-access.middleware";
import {
  accessLogMiddleware,
  requestIdMiddleware,
} from "./middlewares/request.middleware";

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
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Request-ID",
    "X-Swagger-Key",
  ],
  exposedHeaders: ["X-Request-ID"],
};

export const createApp = (): express.Application => {
  const app = express();

  applySecurityMiddleware(app);
  app.use(requestIdMiddleware);

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

  app.get("/ready", (_req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    if (!dbConnected) {
      res.status(503).json({ success: false, ready: false });
      return;
    }
    res.status(200).json({ success: true, ready: true });
  });

  app.get("/live", (_req, res) => {
    res.status(200).json({ success: true, live: true });
  });

  app.use(
    "/api/v1/orders/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
    cashfreeWebhookRouter,
  );

  app.use(cookieParser());

  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));

  app.use(generalRateLimiter);
  app.use(accessLogMiddleware);

  app.use(express.json({ limit: "1mb" }));

  app.get("/docs-json", swaggerAccessGuard, (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use(
    "/docs",
    swaggerAccessGuard,
    swaggerCspMiddleware,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        withCredentials: true,
        persistAuthorization: true,
        url: "/docs-json",
      },
      customSiteTitle: "Gravly API Docs",
    }),
  );

  app.use("/api/v1", v1Router);

  app.use(appErrorHandler);
  app.use(genericErrorHandler);

  return app;
};

export default createApp;
