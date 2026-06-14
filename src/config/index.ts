// =========================================================
// LOAD ENV
// =========================================================
import dotenv from "dotenv";

dotenv.config();

/**
 * =========================================================
 * ENV VALIDATOR
 * =========================================================
 */
const requiredEnvVariables = [
  "NODE_ENV",
  "PORT",

  "MONGODB_URI",

  "JWT_ACCESS_SECRET",
  "JWT_ACCESS_EXPIRES",

  "JWT_REFRESH_SECRET",
  "JWT_REFRESH_EXPIRES",

  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",

  "CLIENT_URL",

  "API_BASE_URL",
];

/**
 * =========================================================
 * CHECK MISSING ENV
 * =========================================================
 */
requiredEnvVariables.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

/**
 * =========================================================
 * SERVER CONFIG TYPE
 * =========================================================
 */
type ServerConfig = {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  CLIENT_URL: string;
  API_BASE_URL: string;

  /**
   * =====================================================
   * JWT
   * =====================================================
   */
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES: string;

  /**
   * =====================================================
   * GOOGLE OAUTH
   * =====================================================
   */
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;

  /**
   * =====================================================
   * CLOUDINARY
   * =====================================================
   */
  CLOUDINARY_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;

  /**
   * =====================================================
   * APPLE OAUTH
   * =====================================================
   */
  APPLE_CLIENT_ID?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  APPLE_PRIVATE_KEY?: string;

  /**
   * =====================================================
   * CORS
   * =====================================================
   */
  CORS_ORIGIN?: string;
};

/**
 * =========================================================
 * SERVER CONFIG
 * =========================================================
 */
export const serverConfig: ServerConfig = {
  /**
   * =====================================================
   * BASIC
   * =====================================================
   */
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  API_BASE_URL: process.env.API_BASE_URL!,

  /**
   * =====================================================
   * DATABASE
   * =====================================================
   */
  MONGODB_URI: process.env.MONGODB_URI as string,

  /**
   * =====================================================
   * JWT
   * =====================================================
   */
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || "15m",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || "30d",

  /**
   * =====================================================
   * GOOGLE OAUTH
   * =====================================================
   */
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,

  /**
   * =====================================================
   * CLOUDINARY
   * =====================================================
   */
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME as string,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,

  /**
   * =====================================================
   * APPLE OAUTH
   * =====================================================
   */
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
  APPLE_KEY_ID: process.env.APPLE_KEY_ID,
  APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY,

  /**
   * =====================================================
   * CORS
   * =====================================================
   */
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
};

/**
 * =========================================================
 * LOG
 * =========================================================
 */
console.log(`Server Config Loaded Successfully (${serverConfig.NODE_ENV})`);
