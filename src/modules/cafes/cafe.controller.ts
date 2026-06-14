import { Request, Response, NextFunction } from "express";
import {
  registerCafeService,
  getApprovedCafesService,
  getCafeByIdService,
  getMyCafeService,
  updateMyCafeService,
  toggleCafeOpenService,
  getPendingCafesService,
  updateCafeStatusService,
} from "./cafe.service";
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
    const userId = req?.user?.id as string;
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

    const bodyDocuments =
      typeof req.body.documents === "string"
        ? JSON.parse(req.body.documents)
        : (req.body.documents ?? {});

    const documents = {
      ...bodyDocuments,
      ...(files?.aadharPhoto?.[0] && {
        aadharPhoto: await uploadToCloudinary(
          files.aadharPhoto[0].path,
          "cafes/docs",
        ),
      }),
      ...(files?.panPhoto?.[0] && {
        panPhoto: await uploadToCloudinary(
          files.panPhoto[0].path,
          "cafes/docs",
        ),
      }),
      ...(files?.fssaiCertificate?.[0] && {
        fssaiCertificate: await uploadToCloudinary(
          files.fssaiCertificate[0].path,
          "cafes/docs",
        ),
      }),
    };

    const bodyBankDetails =
      typeof req.body.bankDetails === "string"
        ? JSON.parse(req.body.bankDetails)
        : (req.body.bankDetails ?? {});

    const bankDetails = {
      ...bodyBankDetails,
      ...(files?.bankPassbookPhoto?.[0] && {
        bankPassbookPhoto: await uploadToCloudinary(
          files.bankPassbookPhoto[0].path,
          "cafes/docs",
        ),
      }),
    };

    const cafe = await registerCafeService(userId, {
      ...req.body,
      cafeImage,
      menuImage,
      gallery,
      documents,
      bankDetails,
    });

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

// =========================================
// GET MY CAFE
// =========================================
export const getMyCafeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req?.user?.id as string;
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
// UPDATE MY CAFE
// =========================================
export const updateMyCafeController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req?.user?.id as string;
    const files = req.files as any;

    let updateData: any = { ...req.body };

    if (files?.cafeImage?.[0]) {
      updateData.cafeImage = await uploadToCloudinary(
        files.cafeImage[0].path,
        "cafes",
      );
    }

    if (files?.menuImage?.[0]) {
      updateData.menuImage = await uploadToCloudinary(
        files.menuImage[0].path,
        "cafes",
      );
    }

    if (files?.gallery?.length) {
      updateData.gallery = await Promise.all(
        files.gallery.map((f: any) =>
          uploadToCloudinary(f.path, "cafes/gallery"),
        ),
      );
    }

    const docPhotoUpdates: Record<string, string> = {};

    if (files?.aadharPhoto?.[0]) {
      docPhotoUpdates["documents.aadharPhoto"] = await uploadToCloudinary(
        files.aadharPhoto[0].path,
        "cafes/docs",
      );
    }

    if (files?.panPhoto?.[0]) {
      docPhotoUpdates["documents.panPhoto"] = await uploadToCloudinary(
        files.panPhoto[0].path,
        "cafes/docs",
      );
    }

    if (files?.fssaiCertificate?.[0]) {
      docPhotoUpdates["documents.fssaiCertificate"] = await uploadToCloudinary(
        files.fssaiCertificate[0].path,
        "cafes/docs",
      );
    }

    if (files?.bankPassbookPhoto?.[0]) {
      docPhotoUpdates["bankDetails.bankPassbookPhoto"] =
        await uploadToCloudinary(files.bankPassbookPhoto[0].path, "cafes/docs");
    }

    updateData = { ...updateData, ...docPhotoUpdates };

    const cafe = await updateMyCafeService(userId, updateData);

    res.json({
      success: true,
      message: "Cafe updated successfully",
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// TOGGLE OPEN / CLOSE
// =========================================
export const toggleCafeOpenController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req?.user?.id as string;
    const cafe = await toggleCafeOpenService(userId);

    res.json({
      success: true,
      message: `Cafe is now ${cafe.isOpen ? "open" : "closed"}`,
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// GET PENDING CAFES
// =========================================
export const getPendingCafesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const cafes = await getPendingCafesService();

    res.json({
      success: true,
      data: cafes,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// APPROVE / REJECT CAFE
// =========================================
export const updateCafeStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const adminId = req?.user?.id as string;
    const cafeId = req.params.id;
    const { status, adminNote } = req.body;
    const cafe = await updateCafeStatusService(
      cafeId,
      status,
      adminNote,
      adminId,
    );

    res.json({
      success: true,
      message: `Cafe ${status} successfully`,
      data: cafe,
    });
  } catch (error) {
    next(error);
  }
};
