import { afterEach, describe, expect, it, vi } from "vitest";
import multer from "multer";
import logger from "../src/config/logger.config";
import { appErrorHandler } from "../src/middlewares/error.middleware";
import { BadGatewayError } from "../src/utils/errors/app.error";

const callHandler = (error: unknown, body: Record<string, unknown> = {}) => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  appErrorHandler(
    error,
    { method: "POST", originalUrl: "/api/v1/cafes/register", body, headers: {} } as never,
    res as never,
    vi.fn(),
  );
  return res;
};

describe("global application error mapping", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maps Multer field and size errors to client errors", () => {
    const unexpected = callHandler(new multer.MulterError("LIMIT_UNEXPECTED_FILE"));
    expect(unexpected.statusCode).toBe(400);
    expect((unexpected.body as any).message).toBe("Unexpected upload field");

    const tooLarge = callHandler(new multer.MulterError("LIMIT_FILE_SIZE"));
    expect(tooLarge.statusCode).toBe(413);
  });

  it("maps Mongoose validation, cast, duplicate, and connectivity errors", () => {
    expect(callHandler(Object.assign(new Error("private value"), { name: "ValidationError" })).statusCode).toBe(400);
    expect(callHandler(Object.assign(new Error("bad cast"), { name: "CastError" })).statusCode).toBe(400);
    const duplicate = callHandler(Object.assign(new Error("duplicate"), { code: 11000, keyPattern: { userId: 1 } }));
    expect(duplicate.statusCode).toBe(409);
    expect((duplicate.body as any).message).toBe("Cafe already registered for this user");
    expect(callHandler(Object.assign(new Error("dns details"), { name: "MongooseServerSelectionError" })).statusCode).toBe(503);
  });

  it("returns a safe Cloudinary error while logging unexpected original errors", () => {
    const cloudinary = callHandler(new BadGatewayError("Media upload service failed"));
    expect(cloudinary.statusCode).toBe(502);
    expect((cloudinary.body as any).message).toBe("Media upload service failed");

    const previousMode = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const error = new Error("internal failure involving 123456789");
    const log = vi.spyOn(logger, "error").mockImplementation(() => logger);
    const unknown = callHandler(error, { accountNumber: "123456789" });
    expect(unknown.statusCode).toBe(500);
    expect((unknown.body as any).message).toBe("Internal Server Error");
    expect(JSON.stringify(unknown.body)).not.toContain(error.stack);
    expect(log).toHaveBeenCalledWith("Application error", expect.objectContaining({
      errorName: "Error",
      message: "internal failure involving [REDACTED]",
      stack: expect.not.stringContaining("123456789"),
    }));
    process.env.NODE_ENV = previousMode;
  });
});
