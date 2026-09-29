import { describe, it, expect } from "vitest";
import { serializePublicUser } from "../src/utils/response/user.serializer";

describe("Authentication Contract", () => {
  it("never contains sensitive fields in public user", () => {
    const fakeUser = {
      _id: "user123",
      name: "John",
      email: "test@example.com",
      passwordHash: "supersecret",
      password: "secretpassword",
      hashedPassword: "hashedsecret",
      salt: "somesalt",
      secret: "internal",
      refreshTokenHash: "rf_hash",
      resetToken: "reset123",
      verificationToken: "verify123",
      otp: "123456"
    };

    const publicUser = serializePublicUser(fakeUser);

    expect(publicUser).not.toHaveProperty("passwordHash");
    expect(publicUser).not.toHaveProperty("password");
    expect(publicUser).not.toHaveProperty("hashedPassword");
    expect(publicUser).not.toHaveProperty("salt");
    expect(publicUser).not.toHaveProperty("secret");
    expect(publicUser).not.toHaveProperty("refreshTokenHash");
    expect(publicUser).not.toHaveProperty("resetToken");
    expect(publicUser).not.toHaveProperty("verificationToken");
    expect(publicUser).not.toHaveProperty("otp");

    expect(publicUser.id).toBe("user123");
    expect(publicUser.email).toBe("test@example.com");
  });
});
