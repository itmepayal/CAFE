import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

// ─── Environment ─────────────────────────────────────────────────────────────

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const LOG_LEVEL = process.env.LOG_LEVEL ?? (IS_PRODUCTION ? "info" : "debug");
const SERVICE_NAME = process.env.SERVICE_NAME ?? "app";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogMeta {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  durationMs?: number;
  statusCode?: number;
  errorCode?: string;
  stack?: string;
  [key: string]: unknown;
}

// ─── Custom formats ───────────────────────────────────────────────────────────
const sanitizeErrors = winston.format((info) => {
  if (info instanceof Error || info.error instanceof Error) {
    const err: Error = info instanceof Error ? info : (info.error as Error);
    info.message = info.message ?? err.message;
    info.stack = err.stack;
    delete info.error;
  }
  return info;
});

const jsonEnvelope = winston.format.printf((info) => {
  const { level, message, timestamp, stack, ...rest } = info;

  const output: Record<string, unknown> = {
    timestamp,
    level,
    service: SERVICE_NAME,
    message,
    ...(stack ? { stack } : {}),
    ...(Object.keys(rest).length ? { meta: rest } : {}),
  };

  return JSON.stringify(output);
});

/** Human-readable format for local development. */
const prettyFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { level, message, timestamp, stack, ...rest } = info;
    const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : "";
    const trace = stack ? `\n${stack}` : "";
    return `[${timestamp}] ${level}: ${message}${meta}${trace}`;
  }),
);

// ─── Shared format pipeline ───────────────────────────────────────────────────

const baseFormat = winston.format.combine(
  sanitizeErrors(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
);

// ─── Transports ───────────────────────────────────────────────────────────────

const consoleTransport = new winston.transports.Console({
  format: IS_PRODUCTION
    ? winston.format.combine(baseFormat, jsonEnvelope)
    : winston.format.combine(baseFormat, prettyFormat),
});

const rotatingFileTransport = new DailyRotateFile({
  filename: "logs/%DATE%-app.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  format: winston.format.combine(baseFormat, jsonEnvelope),
});

const rotatingErrorTransport = new DailyRotateFile({
  level: "error",
  filename: "logs/%DATE%-error.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "30d",
  format: winston.format.combine(baseFormat, jsonEnvelope),
});

// ─── Logger ───────────────────────────────────────────────────────────────────

const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports: [consoleTransport, rotatingFileTransport, rotatingErrorTransport],
  exitOnError: false,
});

// ─── Extended logger type ─────────────────────────────────────────────────────
interface AppLogger extends winston.Logger {
  logHttp(message: string, meta?: LogMeta): void;
}

const appLogger = logger as AppLogger;

appLogger.logHttp = (message: string, meta?: LogMeta): void => {
  appLogger.log("http", message, meta as Record<string, unknown>);
};

export { appLogger as logger, LogMeta, AppLogger };
export default appLogger;
