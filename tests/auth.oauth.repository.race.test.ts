import { beforeEach, describe, expect, it, vi } from "vitest";

const { findOneMock, createMock } = vi.hoisted(() => ({
  findOneMock: vi.fn(),
  createMock: vi.fn(),
}));

vi.mock("../src/models/user", () => ({
  default: { findOne: (...args: unknown[]) => findOneMock(...args), create: (...args: unknown[]) => createMock(...args) },
}));

import User from "../src/models/user";
import { createAppleUser, createGoogleUser } from "../src/modules/auth/auth.repository";

describe("Google concurrent account creation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves duplicate-key race only to the exact Google provider identity", async () => {
    const sameIdentity = {
      _id: "existing-google-user",
      provider: "google",
      providerId: "google-sub-1",
      email: "verified@example.com",
    };
    createMock.mockRejectedValueOnce(Object.assign(new Error("duplicate key"), { code: 11000 }));
    findOneMock.mockResolvedValueOnce(sameIdentity);

    const result = await createGoogleUser({
      name: "Verified User",
      email: "verified@example.com",
      providerId: "google-sub-1",
      role: "student",
    });

    expect(result).toBe(sameIdentity);
    expect(findOneMock).toHaveBeenCalledWith({ provider: "google", providerId: "google-sub-1" });
  });

  it("returns a conflict for a duplicate email owned by another provider identity", async () => {
    createMock.mockRejectedValueOnce(Object.assign(new Error("duplicate key"), { code: 11000 }));
    findOneMock.mockResolvedValueOnce(null);

    await expect(createGoogleUser({
      name: "Verified User",
      email: "existing@example.com",
      providerId: "google-new-sub",
      role: "student",
    })).rejects.toMatchObject({ statusCode: 409 });
    expect(findOneMock).toHaveBeenCalledWith({ provider: "google", providerId: "google-new-sub" });
  });

  it("resolves concurrent Apple creation only to the exact Apple subject", async () => {
    const sameIdentity = {
      _id: "existing-apple-user",
      provider: "apple",
      providerId: "apple-sub-1",
      email: "person@privaterelay.appleid.com",
    };
    createMock.mockRejectedValueOnce(Object.assign(new Error("duplicate key"), { code: 11000 }));
    findOneMock.mockResolvedValueOnce(sameIdentity);

    const result = await createAppleUser({
      email: "person@privaterelay.appleid.com",
      providerId: "apple-sub-1",
      role: "student",
    });

    expect(result).toBe(sameIdentity);
    expect(findOneMock).toHaveBeenCalledWith({ provider: "apple", providerId: "apple-sub-1" });
  });
});
