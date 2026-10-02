import { describe, expect, it, vi } from "vitest";

const logoutMock = vi.hoisted(() => vi.fn());
vi.mock("../src/modules/auth/auth.service", () => ({
  googleLogin: vi.fn(), appleLogin: vi.fn(), getCurrentUser: vi.fn(), changeProfile: vi.fn(), refreshTokens: vi.fn(),
  adminLogin: vi.fn(), adminRegister: vi.fn(), cafeOwnerLogin: vi.fn(), logout: logoutMock,
  logoutAll: vi.fn(), deleteAccount: vi.fn(),
}));
vi.mock("../src/config/cloudinary.config", () => ({ uploadToCloudinary: vi.fn() }));
vi.mock("../src/utils/response/auth.response", () => ({ sendAuthResponse: vi.fn() }));

import { logoutController } from "../src/modules/auth/auth.controller";

describe("logout controller cookie handling", () => {
  it("clears both cookies even when the supplied session is rejected", async () => {
    logoutMock.mockRejectedValueOnce(Object.assign(new Error("invalid"), { statusCode: 401 }));
    const res = { clearCookie: vi.fn(), json: vi.fn() } as any;
    const next = vi.fn();
    const req = { user: { id: "user-a" }, cookies: { refreshToken: "other-users-token" }, body: {} } as any;
    logoutController(req, res, next);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(logoutMock).toHaveBeenCalledWith("user-a", "other-users-token");
    expect(res.clearCookie).toHaveBeenCalledWith("accessToken");
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    expect(next).toHaveBeenCalled();
  });

  it("supports cookie clearing without a refresh token and returns no token material", async () => {
    logoutMock.mockResolvedValueOnce(undefined);
    const res = { clearCookie: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();
    const req = { user: { id: "user-a" }, cookies: {}, body: {} } as any;
    logoutController(req, res, next);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(logoutMock).toHaveBeenCalledWith("user-a", undefined);
    expect(res.clearCookie).toHaveBeenCalledWith("accessToken");
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    expect(res.status).toHaveBeenCalledWith(200);
    const responseBody = res.json.mock.calls[0][0];
    expect(responseBody).toMatchObject({ success: true, message: "Logout successful", data: null });
    expect(JSON.stringify(responseBody)).not.toMatch(/refreshToken|accessToken|token/i);
    expect(next).not.toHaveBeenCalled();
  });
});
