import { describe, expect, it } from "vitest";
import createApp from "../src/app";

describe("app security middleware", () => {
  it("creates an express app instance", () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe("function");
  });
});
