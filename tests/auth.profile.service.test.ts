import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateProfileRepoMock } = vi.hoisted(() => ({ updateProfileRepoMock: vi.fn() }));

vi.mock("../src/modules/auth/auth.repository", () => ({
  findUserById: vi.fn(),
  updateProfileRepo: (...args: unknown[]) => updateProfileRepoMock(...args),
  findUserByEmailWithPassword: vi.fn(),
  createAdminEmailUser: vi.fn(),
}));

import { changeProfile } from "../src/modules/auth/auth.service";

describe("profile service update allowlist", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists only allowlisted fields and trims supported text", async () => {
    updateProfileRepoMock.mockResolvedValue({ _id: "user-authenticated" });
    await changeProfile("user-authenticated", {
      name: "  Example Name  ",
      phone: " 9876543210 ",
      university: " Example University ",
      hostel: " Hostel A ",
      profileImage: "https://cdn.example/avatar.png",
      role: "admin",
      email: "attacker@example.com",
      providerId: "attacker-provider-id",
      isEmailVerified: true,
      isBlocked: true,
      isActive: false,
      passwordHash: "attacker-hash",
      ownedCafe: "cafe-other-owner",
      deviceTokens: ["attacker-token"],
      lastLoginAt: new Date(),
      adminNote: "attacker note",
    } as any);

    expect(updateProfileRepoMock).toHaveBeenCalledWith("user-authenticated", {
      name: "Example Name",
      phone: "9876543210",
      university: "Example University",
      hostel: "Hostel A",
      profileImage: "https://cdn.example/avatar.png",
    });
  });
});
