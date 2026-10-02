import { describe, expect, it, vi } from "vitest";

const deleteAccountMock = vi.hoisted(() => vi.fn());
vi.mock("../src/modules/auth/auth.service", () => ({
  googleLogin: vi.fn(), appleLogin: vi.fn(), getCurrentUser: vi.fn(), changeProfile: vi.fn(),
  refreshTokens: vi.fn(), adminLogin: vi.fn(), adminRegister: vi.fn(), cafeOwnerLogin: vi.fn(),
  logout: vi.fn(), logoutAll: vi.fn(), deleteAccount: (...args: unknown[]) => deleteAccountMock(...args),
}));
vi.mock("../src/config/cloudinary.config", () => ({ uploadToCloudinary: vi.fn() }));

import { deleteAccountController } from "../src/modules/auth/auth.controller";

describe("DELETE /auth/account controller ownership", () => {
  it("deletes only the authenticated user and clears their cookies after success", async () => {
    deleteAccountMock.mockResolvedValueOnce({ message: "Account deleted" });
    const req = {
      user: { id: "authenticated-user" },
      body: { userId: "attacker-selected-user", ownerId: "another-user" },
      params: { userId: "another-user" },
    };
    const res = { clearCookie: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    deleteAccountController(req as never, res as never, next);
    await vi.waitFor(() => expect(deleteAccountMock).toHaveBeenCalledOnce());

    expect(deleteAccountMock).toHaveBeenCalledWith("authenticated-user");
    expect(res.clearCookie).toHaveBeenCalledWith("accessToken");
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    expect(next).not.toHaveBeenCalled();
  });
});
