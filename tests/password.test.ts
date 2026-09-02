import { describe, expect, it } from "vitest";
import { hashPassword, comparePassword } from "../src/utils/auth/password";

describe("password utils", () => {
  it("hashes and verifies password", async () => {
    const hash = await hashPassword("MySecurePass123");
    expect(hash).not.toBe("MySecurePass123");
    await expect(comparePassword("MySecurePass123", hash)).resolves.toBe(true);
    await expect(comparePassword("wrong", hash)).resolves.toBe(false);
  });
});
