import helmet from "helmet";
import { Express } from "express";

export const applySecurityMiddleware = (app: Express): void => {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
};
