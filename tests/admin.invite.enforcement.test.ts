import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../src/models/user", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    collection: { createIndex: vi.fn().mockResolvedValue("bootstrapKey_1") },
    deleteMany: vi.fn(),
  },
}));

vi.mock("../src/models/admin-invite", () => ({
  default: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    create: vi.fn(),
    updateOne: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

vi.mock("../src/modules/auth/auth.repository", () => ({
  findUserByEmailWithPassword: vi.fn(),
  createAdminEmailUser: vi.fn(),
}));

vi.mock("../src/modules/auth/social-auth.core", () => ({
  authenticateUser: vi.fn(async (user) => ({
    user,
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
  })),
}));

vi.mock("../src/utils/auth/password", () => ({
  hashPassword: vi.fn(async () => "hashed-password"),
  comparePassword: vi.fn(async () => true),
}));

import User from "../src/models/user";
import AdminInvite from "../src/models/admin-invite";
import { findUserByEmailWithPassword, createAdminEmailUser } from "../src/modules/auth/auth.repository";
import { adminRegister } from "../src/modules/auth/auth.service";
import { createAdminInviteService } from "../src/modules/admin/admin-invite.service";
import { ForbiddenError, ConflictError } from "../src/utils/errors/app.error";
import { serverConfig } from "../src/config";

describe("Super Admin Invite Token - Production Enforcement Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serverConfig.ADMIN_BOOTSTRAP_TOKEN = "configured-bootstrap-token";
  });

  it("rejects first super-admin registration when bootstrap token is missing", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue(null);
    vi.mocked(User.findOne).mockResolvedValue(null);
    await expect(adminRegister({
      name: "First Super Admin", email: "firstadmin@example.com", password: "Password123!",
    })).rejects.toThrow(ForbiddenError);
    expect(createAdminEmailUser).not.toHaveBeenCalled();
  });

  it("rejects an incorrect first-admin bootstrap token", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue(null);
    vi.mocked(User.findOne).mockResolvedValue(null);
    await expect(adminRegister({
      name: "First Super Admin", email: "firstadmin@example.com", password: "Password123!", inviteToken: "wrong-token",
    })).rejects.toThrow(ForbiddenError);
    expect(createAdminEmailUser).not.toHaveBeenCalled();
  });

  it("accepts the configured bootstrap token and atomically claims the first-admin key", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue(null);
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(createAdminEmailUser).mockResolvedValue({
      _id: "admin-1", name: "First Super Admin", email: "firstadmin@example.com", role: "super_admin",
    } as any);
    await adminRegister({
      name: "First Super Admin", email: "firstadmin@example.com", password: "Password123!", inviteToken: "configured-bootstrap-token",
    });
    expect(createAdminEmailUser).toHaveBeenCalledWith(expect.objectContaining({
      role: "super_admin", bootstrapKey: "initial-super-admin",
    }));
  });

  it("2. Second Super Admin registration without token -> REJECT", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue(null);
    vi.mocked(User.findOne).mockResolvedValue({ _id: "admin-1", role: "super_admin" } as any);

    await expect(
      adminRegister({
        name: "Second Admin",
        email: "secondadmin@example.com",
        password: "Password123!",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("3. Valid invite token -> PASS", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue(null);
    vi.mocked(User.findOne).mockResolvedValue({ _id: "admin-1", role: "super_admin" } as any);

    vi.mocked(AdminInvite.findOne).mockResolvedValue({
      _id: "invite-1",
      email: "secondadmin@example.com",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60000),
    } as any);
    vi.mocked(AdminInvite.findOneAndUpdate).mockResolvedValue({ _id: "invite-1" } as any);

    const createdSubsequentAdmin = {
      _id: "admin-2",
      name: "Second Admin",
      email: "secondadmin@example.com",
      role: "admin",
    } as any;

    vi.mocked(createAdminEmailUser).mockResolvedValue(createdSubsequentAdmin);

    const res = await adminRegister({
      name: "Second Admin",
      email: "secondadmin@example.com",
      password: "Password123!",
      inviteToken: "12345678",
    });

    expect(res.user).toBeDefined();
    expect(res.user.email).toBe("secondadmin@example.com");
    expect(createAdminEmailUser).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "admin",
      }),
    );
  });

  it("4. Invalid or non-existent invite token -> REJECT", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue(null);
    vi.mocked(User.findOne).mockResolvedValue({ _id: "admin-1", role: "super_admin" } as any);
    vi.mocked(AdminInvite.findOne).mockResolvedValue(null);

    await expect(
      adminRegister({
        name: "Second Admin",
        email: "secondadmin@example.com",
        password: "Password123!",
        inviteToken: "99999999",
      }),
    ).rejects.toThrow("Invalid or expired invite token");
  });

  it("5. Expired invite token -> REJECT", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue(null);
    vi.mocked(User.findOne).mockResolvedValue({ _id: "admin-1", role: "super_admin" } as any);
    vi.mocked(AdminInvite.findOne).mockResolvedValue(null); // rejects expired invites before consumption

    await expect(
      adminRegister({
        name: "Expired Admin",
        email: "expired@example.com",
        password: "Password123!",
        inviteToken: "88888888",
      }),
    ).rejects.toThrow("Invalid or expired invite token");
  });

  it("6. Already-used invite token -> REJECT", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue(null);
    vi.mocked(User.findOne).mockResolvedValue({ _id: "admin-1", role: "super_admin" } as any);
    vi.mocked(AdminInvite.findOne).mockResolvedValue(null); // rejects used invites before consumption

    await expect(
      adminRegister({
        name: "Replay Admin",
        email: "replay@example.com",
        password: "Password123!",
        inviteToken: "77777777",
      }),
    ).rejects.toThrow("Invalid or expired invite token");
  });

  it("7. Single-use atomic update enforcement -> Only 1 caller gets the token", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue(null);
    vi.mocked(User.findOne).mockResolvedValue({ _id: "admin-1", role: "super_admin" } as any);

    vi.mocked(AdminInvite.findOne).mockResolvedValue({
      _id: "invite-1", email: undefined, usedAt: null, expiresAt: new Date(Date.now() + 60000),
    } as any);
    // Atomic findOneAndUpdate returns document to first caller, null to second
    vi.mocked(AdminInvite.findOneAndUpdate)
      .mockResolvedValueOnce({
        _id: "invite-1",
        usedAt: new Date(),
      } as any)
      .mockResolvedValueOnce(null);

    vi.mocked(createAdminEmailUser).mockResolvedValue({
      _id: "admin-concurrent",
      email: "c1@example.com",
      role: "admin",
    } as any);

    const call1 = adminRegister({
      name: "Concurrent 1",
      email: "c1@example.com",
      password: "Password123!",
      inviteToken: "12345678",
    });

    const call2 = adminRegister({
      name: "Concurrent 2",
      email: "c2@example.com",
      password: "Password123!",
      inviteToken: "12345678",
    });

    const results = await Promise.allSettled([call1, call2]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
  });

  it("8. Duplicate email registration -> REJECT", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue({
      _id: "existing-admin",
      email: "firstadmin@example.com",
    } as any);

    await expect(
      adminRegister({
        name: "Duplicate Admin",
        email: "firstadmin@example.com",
        password: "Password123!",
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("does not consume an invite when its email restriction mismatches", async () => {
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue(null);
    vi.mocked(User.findOne).mockResolvedValue({ _id: "admin-1", role: "super_admin" } as any);
    vi.mocked(AdminInvite.findOne).mockResolvedValue({
      email: "allowed@example.com", usedAt: null, expiresAt: new Date(Date.now() + 60000),
    } as any);
    await expect(adminRegister({
      name: "Wrong Claimant", email: "wrong@example.com", password: "Password123!", inviteToken: "12345678",
    })).rejects.toThrow(/restricted to a different email/i);
    expect(AdminInvite.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("allows only one concurrent first-admin creation through the unique bootstrap claim", async () => {
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(findUserByEmailWithPassword).mockResolvedValue(null);
    let claimed = false;
    vi.mocked(createAdminEmailUser).mockImplementation(async (data) => {
      if (data.bootstrapKey && claimed) throw new ConflictError("Initial admin registration has already been claimed");
      claimed = true;
      return { _id: "first-admin", role: "super_admin", email: data.email } as any;
    });
    const token = "configured-bootstrap-token";
    const result = await Promise.allSettled([
      adminRegister({ name: "A One", email: "a@example.com", password: "Password123!", inviteToken: token }),
      adminRegister({ name: "B Two", email: "b@example.com", password: "Password123!", inviteToken: token }),
    ]);
    expect(result.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(result.filter((x) => x.status === "rejected")).toHaveLength(1);
  });
});
