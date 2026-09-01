import crypto from "crypto";
import { describe, expect, it } from "vitest";

const hashRefreshToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

describe("refresh token hashing", () => {
  it("produces a stable sha256 hash", () => {
    const token = "sample-refresh-token";
    const first = hashRefreshToken(token);
    const second = hashRefreshToken(token);

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  it("produces different hashes for different tokens", () => {
    expect(hashRefreshToken("token-a")).not.toBe(hashRefreshToken("token-b"));
  });
});
