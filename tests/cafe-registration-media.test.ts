import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  uploadToCloudinaryMock,
  deleteFromCloudinaryMock,
  registerCafeServiceMock,
} = vi.hoisted(() => ({
  uploadToCloudinaryMock: vi.fn(),
  deleteFromCloudinaryMock: vi.fn(),
  registerCafeServiceMock: vi.fn(),
}));

vi.mock("../src/config/cloudinary.config", () => ({
  uploadToCloudinary: (...args: unknown[]) => uploadToCloudinaryMock(...args),
  deleteFromCloudinary: (...args: unknown[]) => deleteFromCloudinaryMock(...args),
}));
vi.mock("../src/modules/cafes/cafe.service", () => ({
  registerCafeService: (...args: unknown[]) => registerCafeServiceMock(...args),
  getApprovedCafesService: vi.fn(),
  getCafeByIdService: vi.fn(),
  getMyCafeService: vi.fn(),
}));

import { registerCafeController } from "../src/modules/cafes/cafe.controller";

const fakeFile = (name: string) => ({ path: name }) as Express.Multer.File;
const allMedia = () => ({
  cafeImage: [fakeFile("cafe.png")],
  menuImage: [fakeFile("menu.png")],
  gallery: [fakeFile("gallery-1.png"), fakeFile("gallery-2.png")],
  layoutPhotos: [fakeFile("layout-1.png"), fakeFile("layout-2.png")],
  interiorPhotos: [fakeFile("interior-1.png"), fakeFile("interior-2.png")],
  exteriorPhotos: [fakeFile("exterior-1.png"), fakeFile("exterior-2.png")],
  aadharPhoto: [fakeFile("aadhar.png")],
  panPhoto: [fakeFile("pan.png")],
  fssaiCertificate: [fakeFile("fssai.png")],
  bankPassbookPhoto: [fakeFile("bank.png")],
});

const invokeController = async (files: ReturnType<typeof allMedia>) => {
  const req = {
    user: { id: "user-1" },
    files,
    body: {
      cafeName: "Cafe Test",
      ownerName: "Owner Test",
      mobile: "9876543210",
      accountHolderName: "Owner Test",
      accountNumber: "123456789",
      ifscCode: "HDFC0001234",
      supportsDelivery: "false",
      ownerId: "attacker-controlled-owner",
      latitude: "0",
      longitude: "78.5",
    },
  };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  await new Promise<void>((resolve) => {
    res.json.mockImplementation(() => { resolve(); return res as any; });
    next.mockImplementation(() => { resolve(); });
    registerCafeController(req as never, res as never, next);
  });
  return { res, next };
};

describe("Cafe registration media uploads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadToCloudinaryMock.mockImplementation(
      async (path: string, folder: string) => `https://cloudinary.test/${folder}/${path}`,
    );
    deleteFromCloudinaryMock.mockResolvedValue(undefined);
    registerCafeServiceMock.mockResolvedValue({ _id: "cafe-1" });
  });

  it("persists each supplied media group independently", async () => {
    const { next } = await invokeController(allMedia());
    expect(next).not.toHaveBeenCalled();
    const payload = registerCafeServiceMock.mock.calls[0][1];
    expect(payload.cafeImage).toContain("cafes/cafe.png");
    expect(payload.menuImage).toContain("cafes/menu/menu.png");
    expect(payload.gallery).toHaveLength(2);
    expect(payload.gallery[0]).toContain("cafes/gallery/");
    expect(payload.layoutPhotos).toHaveLength(2);
    expect(payload.interiorPhotos).toHaveLength(2);
    expect(payload.exteriorPhotos).toHaveLength(2);
    expect(payload.documents.aadharPhoto).toContain("cafes/docs/aadhar.png");
    expect(payload.documents.panPhoto).toContain("cafes/docs/pan.png");
    expect(payload.documents.fssaiCertificate).toContain("cafes/docs/fssai.png");
    expect(payload.bankDetails.bankPassbookPhoto).toContain("cafes/docs/bank.png");
    expect(payload.supportsDelivery).toBe(false);
    expect(payload.location.latitude).toBe(0);
    expect(registerCafeServiceMock).toHaveBeenCalledWith("user-1", payload);
    expect(payload.userId).toBeUndefined();
    expect(payload.ownerId).toBeUndefined();
  });

  it("cleans uploaded assets when saving the Cafe fails", async () => {
    const originalError = new Error("database failed");
    registerCafeServiceMock.mockRejectedValueOnce(originalError);
    const { next } = await invokeController(allMedia());

    expect(next).toHaveBeenCalledWith(originalError);
    expect(uploadToCloudinaryMock).toHaveBeenCalledTimes(14);
    expect(deleteFromCloudinaryMock).toHaveBeenCalledTimes(14);
  });

  it("preserves the registration error when Cloudinary cleanup also fails", async () => {
    const originalError = new Error("database failed");
    registerCafeServiceMock.mockRejectedValueOnce(originalError);
    deleteFromCloudinaryMock.mockRejectedValue(new Error("cleanup failed"));

    const { next } = await invokeController(allMedia());
    expect(next).toHaveBeenCalledWith(originalError);
  });

  it("does not return bank or KYC fields in the registration response", async () => {
    registerCafeServiceMock.mockResolvedValueOnce({
      _id: "cafe-1",
      cafeName: "Cafe Test",
      status: "pending",
      isApproved: false,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      bankDetails: { accountNumber: "123456789" },
      documents: { aadharNumber: "123456789012" },
    });
    const { res } = await invokeController(allMedia());
    const response = (res.json as any).mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(201);
    expect(response.data).toEqual(expect.objectContaining({ _id: "cafe-1", status: "pending" }));
    expect(response.data.bankDetails).toBeUndefined();
    expect(response.data.documents).toBeUndefined();
  });
});
