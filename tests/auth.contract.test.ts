import { describe, it, expect } from "vitest";
import { serializeCurrentUser, serializePublicUser } from "../src/utils/response/user.serializer";

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

  it("keeps /auth/me to the safe current-user contract", () => {
    const current = serializeCurrentUser({
      _id: { toString: () => "user123" }, name: "John", email: "test@example.com",
      profileImage: "avatar.png", phone: "123", role: "student", provider: "google",
      providerId: "secret-subject", passwordHash: "secret", deviceTokens: [{ token: "secret" }],
      ownedCafe: { bankDetails: { accountNumber: "secret" } }, favoriteCafes: [{ documents: ["secret"] }],
      adminNote: "secret", refreshToken: "secret", isEmailVerified: true, university: "Uni", hostel: "Hostel",
      isCafeOwner: false,
    });
    expect(current).toMatchObject({ id: "user123", name: "John", email: "test@example.com", role: "student" });
    for (const key of ["providerId", "passwordHash", "deviceTokens", "ownedCafe", "favoriteCafes", "adminNote", "refreshToken"])
      expect(current).not.toHaveProperty(key);
  });
});
