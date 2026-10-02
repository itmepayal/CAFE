import { Request, Response } from "express";
import {
  registerCafeService,
  getApprovedCafesService,
  getCafeByIdService,
  getMyCafeService,
} from "./cafe.service";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../config/cloudinary.config";
import { collectFigmaRegistrationMediaErrors } from "./cafe.validation";
import {
  BadRequestError,
  UnauthorizedError,
} from "../../utils/errors/app.error";
import { ApiResponse } from "../../utils/response/app.response";
import { logger } from "../../config/logger.config";
import { asyncHandler } from "../../utils/handlers/async.handler";

type UploadedFiles = Record<string, Express.Multer.File[] | undefined>;

// =========================================
// REGISTER CAFE CONTROLLER
// =========================================
export const registerCafeController = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const uploadedAssetUrls: string[] = [];
  const uploadTasks: Promise<string>[] = [];
  let userId: string | undefined;
  let stage = "request_validation";
  try {
    userId = req.user?.id;
    if (!userId) throw new UnauthorizedError("Authentication required");
    const files = (req.files ?? {}) as UploadedFiles;
    const uploadFile = (file: Express.Multer.File, folder: string) => {
      stage = "cloudinary_upload";
      if (!file?.path) {
        throw new BadRequestError("Uploaded file is missing a valid temporary path");
      }
      const task = uploadToCloudinary(file.path, folder).then((url) => {
        uploadedAssetUrls.push(url);
        return url;
      });
      uploadTasks.push(task);
      return task;
    };
    const uploadOne = (list: Express.Multer.File[] | undefined, folder: string) =>
      list?.[0] ? uploadFile(list[0], folder) : Promise.resolve("");
    const uploadList = (list: Express.Multer.File[] | undefined, folder: string) =>
      list?.length ? Promise.all(list.map((file) => uploadFile(file, folder))) : Promise.resolve([]);

    const cafeImageFile = files.cafeImage?.length ? files.cafeImage : files.ownerPhoto;
    const fssaiFile = files.fssaiCertificate?.length
      ? files.fssaiCertificate
      : files.shopEstablishmentCertificate;

    const [
      cafeImage,
      menuImage,
      gallery,
      layoutPhotos,
      interiorPhotos,
      exteriorPhotos,
      aadharPhoto,
      panPhoto,
      fssaiCertificate,
      bankPassbookPhoto,
    ] = await Promise.all([
      uploadOne(cafeImageFile, "cafes"),
      uploadOne(files.menuImage, "cafes/menu"),
      uploadList(files.gallery, "cafes/gallery"),
      uploadList(files.layoutPhotos, "cafes/layout"),
      uploadList(files.interiorPhotos, "cafes/interior"),
      uploadList(files.exteriorPhotos, "cafes/exterior"),
      uploadOne(files.aadharPhoto, "cafes/docs"),
      uploadOne(files.panPhoto, "cafes/docs"),
      uploadOne(fssaiFile, "cafes/docs"),
      uploadOne(files.bankPassbookPhoto, "cafes/docs"),
    ]);

    const mediaErrors = collectFigmaRegistrationMediaErrors({
      cafeImage,
      layoutPhotos,
      fssaiCertificate,
      bankPassbookPhoto,
    });

    if (mediaErrors.length > 0) {
      throw new BadRequestError(mediaErrors.join(". "));
    }

    stage = "build_registration_payload";
    const payload = {
      cafeName: req.body.cafeName,
      ownerName: req.body.ownerName,
      description: req.body.description ?? "",
      mobile: req.body.mobile,
      email: req.body.email ?? "",

      address: {
        searchLocation: req.body.searchLocation,
        street: req.body.street,
        area: req.body.area,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
        landmark: req.body.landmark,
      },

      location: {
        latitude: req.body.latitude ? Number(req.body.latitude) : undefined,
        longitude: req.body.longitude ? Number(req.body.longitude) : undefined,
      },

      cafeImage,
      menuImage,
      gallery,
      layoutPhotos,
      interiorPhotos,
      exteriorPhotos,

      documents: {
        aadharNumber: req.body.aadharNumber ?? "",
        aadharPhoto,
        panNumber: req.body.panNumber ?? "",
        panPhoto,
        fssaiNumber: req.body.fssaiNumber ?? "",
        fssaiCertificate,
      },

      bankDetails: {
        accountHolderName: req.body.accountHolderName,
        accountNumber: req.body.accountNumber,
        bankName: req.body.bankName ?? "",
        ifscCode: req.body.ifscCode,
        upiId: req.body.upiId ?? "",
        gstId: req.body.gstId ?? "",
        bankPassbookPhoto,
      },

      socialMedia: {
        instagram: req.body.instagram ?? "",
        facebook: req.body.facebook ?? "",
        website: req.body.website ?? "",
      },
      registrationFeedback: "",
      supportsDelivery: req.body.supportsDelivery === "true",
    };

    stage = "registration_service";
    const cafe = await registerCafeService(userId, payload);
    ApiResponse.success(res, "Cafe registered successfully", {
      _id: cafe._id,
      cafeName: cafe.cafeName,
      status: cafe.status,
      isApproved: cafe.isApproved,
      createdAt: cafe.createdAt,
      updatedAt: cafe.updatedAt,
    }, 201);
  } catch (error) {
    const errorRecord = error && typeof error === "object"
      ? error as { name?: string; message?: string; stack?: string; code?: string | number; statusCode?: number }
      : undefined;
    const sensitiveValues = [
      req.body?.accountNumber,
      req.body?.confirmAccountNumber,
      req.body?.aadharNumber,
      req.body?.panNumber,
      ...uploadedAssetUrls,
      process.env.MONGODB_URI,
      process.env.JWT_ACCESS_SECRET,
      process.env.JWT_REFRESH_SECRET,
      process.env.CLOUDINARY_API_KEY,
      process.env.CLOUDINARY_API_SECRET,
      process.env.CASHFREE_SECRET_KEY,
    ].filter((value): value is string => typeof value === "string" && value.length >= 4);
    const redact = (value?: string) => sensitiveValues.reduce(
      (result, secret) => result.split(secret).join("[REDACTED]"),
      value ?? "",
    );
    const inferredStatus = errorRecord?.code === 11000
      ? 409
      : ["ValidationError", "CastError"].includes(errorRecord?.name ?? "")
        ? 400
        : 500;
    const errorStatus = errorRecord?.statusCode ?? inferredStatus;
    let rawErrorMessage = error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : errorRecord?.message;
    if (!rawErrorMessage && error !== undefined) {
      try {
        rawErrorMessage = JSON.stringify(error);
      } catch {
        rawErrorMessage = String(error);
      }
    }
    const errorDetails = {
      userId,
      stage,
      errorName: error instanceof Error ? error.name : errorRecord?.name,
      errorCode: errorRecord?.code,
      errorMessage: redact(rawErrorMessage),
      stack: redact(error instanceof Error ? error.stack : errorRecord?.stack),
    };
    if (errorStatus >= 500) {
      logger.error("Cafe registration failed", errorDetails);
    } else {
      logger.warn("Cafe registration request rejected", errorDetails);
    }
    await Promise.allSettled(uploadTasks);
    const cleanupResults = await Promise.allSettled(
      uploadedAssetUrls.map((url) => deleteFromCloudinary(url)),
    );
    cleanupResults.forEach((result) => {
      if (result.status === "rejected") {
        const cleanupError = result.reason as {
          name?: string;
          message?: string;
          stack?: string;
          code?: string | number;
        };
        logger.error("Failed to clean up Cafe registration Cloudinary asset", {
          errorName: cleanupError?.name,
          errorCode: cleanupError?.code,
          errorMessage: redact(cleanupError?.message),
          stack: redact(cleanupError?.stack),
        });
      }
    });
    throw error;
  }
});

// =========================================
// GET APPROVED CAFES
// =========================================
export const getApprovedCafesController = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const search = req.query.search as string | undefined;
  const city = req.query.city as string | undefined;
  const isOpen = req.query.isOpen as boolean | undefined;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  const result = await getApprovedCafesService(
    search,
    city,
    page,
    limit,
    isOpen,
  );

  ApiResponse.success(res, "Approved cafes fetched successfully", {
    cafes: result.cafes,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
});

// =========================================
// GET MY CAFE
// =========================================
export const getMyCafeController = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedError("Authentication required");

  const cafe = await getMyCafeService(userId);

  ApiResponse.success(res, "My cafe", cafe);
});

// =========================================
// GET CAFE BY ID
// =========================================
export const getCafeByIdController = asyncHandler(async (
  req: Request,
  res: Response,
): Promise<void> => {
  const cafe = await getCafeByIdService(req.params.id);

  ApiResponse.success(res, "Cafe fetched", cafe);
});
