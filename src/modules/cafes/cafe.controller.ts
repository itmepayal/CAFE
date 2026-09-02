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
    const files = req.files as any;

    const cafeImage = files?.cafeImage?.[0]
      ? await uploadToCloudinary(files.cafeImage[0].path, "cafes")
      : "";

    const menuImage = files?.menuImage?.[0]
      ? await uploadToCloudinary(files.menuImage[0].path, "cafes")
      : "";

    const gallery =
      files?.gallery?.length > 0
        ? await Promise.all(
            files.gallery.map((file: any) =>
              uploadToCloudinary(file.path, "cafes/gallery"),
            ),
          )
        : [];

    const layoutPhotos =
      files?.layoutPhotos?.length > 0
        ? await Promise.all(
            files.layoutPhotos.map((file: any) =>
              uploadToCloudinary(file.path, "cafes/layout"),
            ),
          )
        : [];

    const address = {
      street: req.body.street,
      area: req.body.area,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      landmark: req.body.landmark,
    };

    const location = {
      latitude: req.body.latitude ? Number(req.body.latitude) : undefined,
      longitude: req.body.longitude ? Number(req.body.longitude) : undefined,
    };

    const documents = {
      aadharNumber: req.body.aadharNumber,
      panNumber: req.body.panNumber,
      fssaiNumber: req.body.fssaiNumber,
      aadharPhoto: files?.aadharPhoto?.[0]
        ? await uploadToCloudinary(files.aadharPhoto[0].path, "cafes/docs")
        : "",
      panPhoto: files?.panPhoto?.[0]
        ? await uploadToCloudinary(files.panPhoto[0].path, "cafes/docs")
        : "",
      fssaiCertificate: files?.fssaiCertificate?.[0]
        ? await uploadToCloudinary(files.fssaiCertificate[0].path, "cafes/docs")
        : "",
    };

    const bankDetails = {
      accountHolderName: req.body.accountHolderName,
      accountNumber: req.body.accountNumber,
      bankName: req.body.bankName,
      ifscCode: req.body.ifscCode,
      upiId: req.body.upiId,
      gstId: req.body.gstId ?? "",
      bankPassbookPhoto: files?.bankPassbookPhoto?.[0]
        ? await uploadToCloudinary(
            files.bankPassbookPhoto[0].path,
            "cafes/docs",
          )
        : "",
    };

    const socialMedia = {
      instagram: req.body.instagram ?? "",
      facebook: req.body.facebook ?? "",
      website: req.body.website ?? "",
    };

    const supportsDelivery = req.body.supportsDelivery === "true";

    const payload = {
      cafeName: req.body.cafeName,
      ownerName: req.body.ownerName,
      description: req.body.description,
      mobile: req.body.mobile,
      email: req.body.email,

      address,
      location,

      cafeImage,
      menuImage,
      gallery,
      layoutPhotos,

      documents,
      bankDetails,
      socialMedia,
      registrationFeedback: req.body.registrationFeedback ?? "",

      supportsDelivery,
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
    const files = req.files as any;
    let stepData: Record<string, unknown> = { ...req.body };

    if (step === 4) {
      if (files?.cafeImage?.[0]) {
        stepData.cafeImage = await uploadToCloudinary(
          files.cafeImage[0].path,
          "cafes",
        );
      }

      if (files?.menuImage?.[0]) {
        stepData.menuImage = await uploadToCloudinary(
          files.menuImage[0].path,
          "cafes",
        );
      }

      if (files?.gallery?.length) {
        stepData.gallery = await Promise.all(
          files.gallery.map((file: any) =>
            uploadToCloudinary(file.path, "cafes/gallery"),
          ),
        );
      }

      if (files?.layoutPhotos?.length) {
        stepData.layoutPhotos = await Promise.all(
          files.layoutPhotos.map((file: any) =>
            uploadToCloudinary(file.path, "cafes/layout"),
          ),
        );
      }

      if (files?.aadharPhoto?.[0]) {
        stepData.aadharPhoto = await uploadToCloudinary(
          files.aadharPhoto[0].path,
          "cafes/docs",
        );
      }

      if (files?.panPhoto?.[0]) {
        stepData.panPhoto = await uploadToCloudinary(
          files.panPhoto[0].path,
          "cafes/docs",
        );
      }

      if (files?.fssaiCertificate?.[0]) {
        stepData.fssaiCertificate = await uploadToCloudinary(
          files.fssaiCertificate[0].path,
          "cafes/docs",
        );
      }

      if (files?.bankPassbookPhoto?.[0]) {
        stepData.bankPassbookPhoto = await uploadToCloudinary(
          files.bankPassbookPhoto[0].path,
          "cafes/docs",
        );
      }

      const existingDraft = await getRegistrationDraftService(userId);
      const existingStep4 = (existingDraft as any).step4 ?? {};

      stepData = {
        ...existingStep4,
        ...stepData,
        gallery: [
          ...(existingStep4.gallery ?? []),
          ...((stepData.gallery as string[]) ?? []),
        ],
        layoutPhotos: [
          ...(existingStep4.layoutPhotos ?? []),
          ...((stepData.layoutPhotos as string[]) ?? []),
        ],
      };
    }

    if (step === 5) {
      stepData = {
        registrationFeedback: req.body.registrationFeedback ?? "",
        socialMedia: {
          instagram: req.body.instagram ?? "",
          facebook: req.body.facebook ?? "",
          website: req.body.website ?? "",
        },
      };
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
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await getApprovedCafesService(search, city, page, limit);

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
