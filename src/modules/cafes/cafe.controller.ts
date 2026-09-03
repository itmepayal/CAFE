import { Request, Response, NextFunction } from "express";
import {
  registerCafeService,
  getApprovedCafesService,
  getCafeByIdService,
  getMyCafeService,
} from "./cafe.service";
import {
  getRegistrationDraftService,
  saveRegistrationDraftStepService,
  submitRegistrationDraftService,
  clearRegistrationDraftService,
} from "./cafe-draft.service";
import { uploadToCloudinary } from "../../config/cloudinary.config";
import { collectFigmaRegistrationMediaErrors } from "./cafe.validation";
import { BadRequestError } from "../../utils/errors/app.error";

type UploadedFiles = Record<string, Express.Multer.File[] | undefined>;

const uploadFile = async (file: Express.Multer.File, folder: string) =>
  uploadToCloudinary(file.path, folder);

const uploadMany = async (files: Express.Multer.File[], folder: string) =>
  Promise.all(files.map((file) => uploadFile(file, folder)));

// =========================================
// REGISTER CAFE CONTROLLER
// =========================================
export const registerCafeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    const files = req.files as UploadedFiles;

    const layoutPhotos = files?.layoutPhotos?.length
      ? await uploadMany(files.layoutPhotos, "cafes/layout")
      : [];

    const ownerPhoto = files?.ownerPhoto?.[0]
      ? await uploadFile(files.ownerPhoto[0], "cafes")
      : "";

    const shopEstablishmentCertificate = files?.shopEstablishmentCertificate?.[0]
      ? await uploadFile(files.shopEstablishmentCertificate[0], "cafes/docs")
      : "";

    const bankPassbookPhoto = files?.bankPassbookPhoto?.[0]
      ? await uploadFile(files.bankPassbookPhoto[0], "cafes/docs")
      : "";

    const mediaErrors = collectFigmaRegistrationMediaErrors({
      ownerPhoto,
      layoutPhotos,
      shopEstablishmentCertificate,
      bankPassbookPhoto,
    });

    if (mediaErrors.length > 0) {
      throw new BadRequestError(mediaErrors.join(". "));
    }

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

      cafeImage: ownerPhoto,
      menuImage: "",
      gallery: layoutPhotos,
      layoutPhotos,
      interiorPhotos: [],
      exteriorPhotos: [],

      documents: {
        aadharNumber: "",
        aadharPhoto: "",
        panNumber: "",
        panPhoto: "",
        fssaiNumber: "",
        fssaiCertificate: shopEstablishmentCertificate,
      },

      bankDetails: {
        accountHolderName: req.body.accountHolderName,
        accountNumber: req.body.accountNumber,
        bankName: req.body.bankName ?? "",
        ifscCode: req.body.ifscCode,
        upiId: "",
        gstId: req.body.gstId ?? "",
        bankPassbookPhoto,
      },

      socialMedia: { instagram: "", facebook: "", website: "" },
      registrationFeedback: "",
      supportsDelivery: req.body.supportsDelivery === "true",
    };

    const cafe = await registerCafeService(userId, payload);
    res.status(201).json({
      success: true,
      message: "Cafe registered successfully",
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// GET REGISTRATION DRAFT
// =========================================
export const getRegistrationDraftController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    const draft = await getRegistrationDraftService(userId);

    res.json({
      success: true,
      data: draft,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// SAVE REGISTRATION DRAFT STEP
// =========================================
export const saveRegistrationDraftStepController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    const step = Number(req.params.step);
    const files = req.files as UploadedFiles;
    let stepData: Record<string, unknown> = { ...req.body };

    if (step === 4) {
      const existingDraft = await getRegistrationDraftService(userId);
      const existingStep4 = (existingDraft as { step4?: Record<string, unknown> }).step4 ?? {};

      if (files?.ownerPhoto?.[0]) {
        stepData.ownerPhoto = await uploadFile(files.ownerPhoto[0], "cafes");
      }

      const newLayout = files?.layoutPhotos?.length
        ? await uploadMany(files.layoutPhotos, "cafes/layout")
        : [];

      stepData = {
        ...existingStep4,
        ...stepData,
        layoutPhotos: [
          ...((existingStep4.layoutPhotos as string[]) ?? []),
          ...newLayout,
        ],
      };
    }

    if (step === 5) {
      const existingDraft = await getRegistrationDraftService(userId);
      const existingStep5 = (existingDraft as { step5?: Record<string, unknown> }).step5 ?? {};

      if (files?.shopEstablishmentCertificate?.[0]) {
        stepData.shopEstablishmentCertificate = await uploadFile(
          files.shopEstablishmentCertificate[0],
          "cafes/docs",
        );
      }

      if (files?.bankPassbookPhoto?.[0]) {
        stepData.bankPassbookPhoto = await uploadFile(
          files.bankPassbookPhoto[0],
          "cafes/docs",
        );
      }

      stepData = { ...existingStep5, ...stepData };
    }

    const draft = await saveRegistrationDraftStepService(userId, step, stepData);

    res.json({
      success: true,
      message: `Step ${step} saved successfully`,
      data: draft,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// SUBMIT REGISTRATION DRAFT
// =========================================
export const submitRegistrationDraftController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    const cafe = await submitRegistrationDraftService(userId);

    res.status(201).json({
      success: true,
      message: "Cafe registration submitted successfully",
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// CLEAR REGISTRATION DRAFT
// =========================================
export const clearRegistrationDraftController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;
    await clearRegistrationDraftService(userId);

    res.json({
      success: true,
      message: "Registration draft cleared",
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// GET APPROVED CAFES
// =========================================
export const getApprovedCafesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
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

    res.json({
      success: true,
      data: result.cafes,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// GET MY CAFE
// =========================================
export const getMyCafeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id as string;

    const cafe = await getMyCafeService(userId);

    res.json({
      success: true,
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// GET CAFE BY ID
// =========================================
export const getCafeByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cafe = await getCafeByIdService(req.params.id);

    res.json({
      success: true,
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};
