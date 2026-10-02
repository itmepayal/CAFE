import { beforeEach, describe, expect, it, vi } from "vitest";

const { changeProfileMock, uploadToCloudinaryMock } = vi.hoisted(() => ({
  changeProfileMock: vi.fn(),
  uploadToCloudinaryMock: vi.fn(),
}));

vi.mock("../src/modules/auth/auth.service", () => ({
  googleLogin: vi.fn(), appleLogin: vi.fn(), getCurrentUser: vi.fn(),
  changeProfile: (...args: unknown[]) => changeProfileMock(...args),
  refreshTokens: vi.fn(), adminLogin: vi.fn(), adminRegister: vi.fn(),
  cafeOwnerLogin: vi.fn(), logout: vi.fn(), logoutAll: vi.fn(), deleteAccount: vi.fn(),
}));
vi.mock("../src/config/cloudinary.config", () => ({ uploadToCloudinary: (...args: unknown[]) => uploadToCloudinaryMock(...args) }));

import { changeProfileController } from "../src/modules/auth/auth.controller";

describe("profile update controller response safety", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses authenticated ID and serializes a raw user without private or internal fields", async () => {
    changeProfileMock.mockResolvedValue({
      _id: "authenticated-user",
      name: "Example Name",
      email: "user@example.com",
      profileImage: "avatar.png",
      phone: "9876543210",
      role: "student",
      provider: "google",
      providerId: "provider-secret",
      passwordHash: "password-secret",
      deviceTokens: [{ token: "device-secret" }],
      lastLoginAt: new Date(),
      loginCount: 10,
      isBlocked: false,
      isActive: true,
      isEmailVerified: true,
      adminNote: "internal",
      bootstrapKey: "internal",
      ownedCafe: "cafe-secret",
      university: "University",
      hostel: "Hostel",
      isCafeOwner: false,
    });
    const req = {
      user: { id: "authenticated-user" },
      body: { name: "Example Name" },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    changeProfileController(req as never, res as never, next);
    await vi.waitFor(() => expect(res.json).toHaveBeenCalledOnce());

    expect(changeProfileMock).toHaveBeenCalledWith("authenticated-user", {
      name: "Example Name", profileImage: undefined,
    });
    const response = res.json.mock.calls[0][0];
    expect(response.data).toMatchObject({ id: "authenticated-user", name: "Example Name" });
    for (const secret of [
      "passwordHash", "providerId", "deviceTokens", "lastLoginAt", "loginCount",
      "isBlocked", "isActive", "adminNote", "bootstrapKey",
    ]) {
      expect(response.data).not.toHaveProperty(secret);
    }
    expect(next).not.toHaveBeenCalled();
  });
});
