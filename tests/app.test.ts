import { describe, expect, it } from "vitest";
import request from "supertest";
import createApp from "../src/app";

describe("app security middleware", () => {
  it("creates an express app instance", () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe("function");
  });
});

describe("swagger documentation routes", () => {
  const app = createApp();

  it("serves OpenAPI JSON at /docs-json", async () => {
    const res = await request(app).get("/docs-json");
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe("3.0.0");
    expect(res.body.info?.title).toMatch(/Gravly/i);
    expect(res.body.paths).toBeDefined();
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(0);
  });

  it("serves Swagger UI at /docs", async () => {
    const res = await request(app).get("/docs/");
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/swagger/i);
  });

  it("exposes health live ready probes", async () => {
    const health = await request(app).get("/health");
    const live = await request(app).get("/live");
    const ready = await request(app).get("/ready");
    expect(health.status).toBeGreaterThanOrEqual(200);
    expect(live.status).toBe(200);
    expect(live.body.live).toBe(true);
    expect([200, 503]).toContain(ready.status);
  });

  it("sets CSP header on /docs", async () => {
    const res = await request(app).get("/docs/");
    expect(res.status).toBe(200);
    const csp = res.headers["content-security-policy"];
    expect(csp).toBeDefined();
    expect(String(csp)).toMatch(/default-src/);
  });
});
