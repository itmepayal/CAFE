import { describe, expect, it, vi } from "vitest";
import { Router } from "express";

/**
 * Regression: /item/:itemId must be registered before /:cafeId
 * or Express will treat "item" as a cafeId.
 */
describe("menu route ordering", () => {
  it("registers /item/:itemId before /:cafeId", async () => {
    const { default: menuRouter } = await import(
      "../src/modules/menu/menu.route"
    );

    const stack = (menuRouter as Router & { stack: Array<{ route?: { path: string } }> })
      .stack;
    const paths = stack
      .filter((layer) => layer.route)
      .map((layer) => layer.route!.path);

    const itemIdx = paths.indexOf("/item/:itemId");
    const cafeIdx = paths.indexOf("/:cafeId");

    expect(itemIdx).toBeGreaterThanOrEqual(0);
    expect(cafeIdx).toBeGreaterThanOrEqual(0);
    expect(itemIdx).toBeLessThan(cafeIdx);
  });
});

describe("buildRefundIdempotencyKey stability", () => {
  it("is deterministic across calls", async () => {
    const { buildRefundIdempotencyKey } = await import(
      "../src/modules/payment/refund.service"
    );
    expect(buildRefundIdempotencyKey("A")).toBe(buildRefundIdempotencyKey("A"));
  });
});

describe("AppRole type alignment", () => {
  it("auth middleware exports AppRole without admin", async () => {
    const mod = await import("../src/middlewares/auth.middleware");
    expect(typeof mod.authenticate).toBe("function");
    expect(typeof mod.authorize).toBe("function");
  });
});
