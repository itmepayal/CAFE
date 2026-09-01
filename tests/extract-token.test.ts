import { describe, expect, it } from "vitest";
import { extractAccessToken } from "../src/utils/auth/extract-token";

describe("extractAccessToken", () => {
  it("reads token from Authorization Bearer header", () => {
    const req = {
      headers: { authorization: "Bearer mobile-jwt-token" },
      cookies: { accessToken: "cookie-token" },
    } as any;

    expect(extractAccessToken(req)).toBe("mobile-jwt-token");
  });

  it("falls back to accessToken cookie", () => {
    const req = {
      headers: {},
      cookies: { accessToken: "cookie-token" },
    } as any;

    expect(extractAccessToken(req)).toBe("cookie-token");
  });

  it("returns undefined when no token present", () => {
    const req = {
      headers: {},
      cookies: {},
    } as any;

    expect(extractAccessToken(req)).toBeUndefined();
  });
});
