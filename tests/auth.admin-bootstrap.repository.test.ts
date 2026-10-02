import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/models/user", () => ({ default: {
  create: vi.fn(), findOne: vi.fn(),
  collection: { createIndex: vi.fn(async () => "bootstrapKey_1") },
} }));
import User from "../src/models/user";
import { createAdminEmailUser } from "../src/modules/auth/auth.repository";
import { ConflictError } from "../src/utils/errors/app.error";

describe("bootstrap admin repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ensures the unique cross-instance bootstrap index before creating the initial admin", async () => {
    vi.mocked(User.create).mockResolvedValue({ _id: "u1" } as never);
    await createAdminEmailUser({ name: "Root", email: "root@example.com", passwordHash: "hash", role: "super_admin", bootstrapKey: "initial-super-admin" });
    expect(User.collection.createIndex).toHaveBeenCalledWith(
      { bootstrapKey: 1 }, { unique: true, sparse: true, name: "bootstrapKey_1" },
    );
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ bootstrapKey: "initial-super-admin" }));
  });

  it("fails closed when the unique index cannot be ensured", async () => {
    vi.mocked(User.collection.createIndex).mockRejectedValueOnce(new Error("index unavailable"));
    await expect(createAdminEmailUser({ name: "Root", email: "root@example.com", passwordHash: "hash", role: "super_admin", bootstrapKey: "initial-super-admin" })).rejects.toThrow(/Failed to secure initial admin registration/);
    expect(User.create).not.toHaveBeenCalled();
  });

  it("maps a duplicate bootstrap-key race to a safe conflict", async () => {
    vi.mocked(User.create).mockRejectedValueOnce({
      code: 11000, keyPattern: { bootstrapKey: 1 },
    });
    await expect(createAdminEmailUser({
      name: "Root", email: "root@example.com", passwordHash: "hash", role: "super_admin", bootstrapKey: "initial-super-admin",
    })).rejects.toBeInstanceOf(ConflictError);
  });

  it("maps a duplicate-email registration race to a safe conflict", async () => {
    vi.mocked(User.create).mockRejectedValueOnce({
      code: 11000, keyPattern: { email: 1 },
    });
    await expect(createAdminEmailUser({
      name: "Duplicate", email: "root@example.com", passwordHash: "hash", role: "admin",
    })).rejects.toBeInstanceOf(ConflictError);
  });

  it("maps the unique email-provider identity race to a safe conflict", async () => {
    vi.mocked(User.create).mockRejectedValueOnce({
      code: 11000,
      keyPattern: { provider: 1, providerId: 1 },
      keyValue: { provider: "email", providerId: "email:root@example.com" },
    });
    await expect(createAdminEmailUser({
      name: "Duplicate", email: "root@example.com", passwordHash: "hash", role: "admin",
    })).rejects.toBeInstanceOf(ConflictError);
  });
});
