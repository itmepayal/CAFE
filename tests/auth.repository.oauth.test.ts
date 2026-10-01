import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, InternalServerError } from "../src/utils/errors/app.error";

vi.mock("../src/models/user", () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
  },
}));

import User from "../src/models/user";
import { createGoogleUser } from "../src/modules/auth/auth.repository";

describe("OAuth user creation race handling", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves duplicate creation only by the exact provider identity", async () => {
    const exactIdentity = {
      _id: "user-winner",
      provider: "google",
      providerId: "google-subject",
      email: "person@example.com",
    };
    vi.mocked(User.create).mockRejectedValue({ code: 11000 });
    vi.mocked(User.findOne).mockResolvedValue(exactIdentity as never);

    await expect(createGoogleUser({
      name: "Person",
      email: "person@example.com",
      providerId: "google-subject",
      role: "student",
    })).resolves.toBe(exactIdentity);

    expect(User.findOne).toHaveBeenCalledWith({
      provider: "google",
      providerId: "google-subject",
    });
  });

  it("returns conflict when duplicate creation has no exact identity match", async () => {
    vi.mocked(User.create).mockRejectedValue({ code: 11000 });
    vi.mocked(User.findOne).mockResolvedValue(null);

    await expect(createGoogleUser({
      name: "Person",
      email: "person@example.com",
      providerId: "google-subject",
      role: "student",
    })).rejects.toBeInstanceOf(ConflictError);

    expect(User.findOne).toHaveBeenCalledWith({
      provider: "google",
      providerId: "google-subject",
    });
  });

  it("preserves unexpected database failures as internal errors", async () => {
    vi.mocked(User.create).mockRejectedValue(new Error("database unavailable"));

    await expect(createGoogleUser({
      name: "Person",
      email: "person@example.com",
      providerId: "google-subject",
      role: "student",
    })).rejects.toBeInstanceOf(InternalServerError);

    expect(User.findOne).not.toHaveBeenCalled();
  });
});
