import { Request, Response, NextFunction } from "express";
import {
  getApprovedCafesService,
  getMyCafeService,
  updateMyCafeService,
  toggleCafeOpenService,
  createMenuItemService,
  updateMenuItemService,
  deleteMenuItemService,
  toggleMenuAvailabilityService,
  getMyComplaintsService,
} from "./owner.service";
import { uploadToCloudinary } from "../../config/cloudinary.config";

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
    console.log(req.body);
    console.log(req.files);
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

/**
 * =========================================================
 * CREATE MENU ITEM
 * =========================================================
 */
export const createMenuItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let image = "";

    if (req.file) {
      image = await uploadToCloudinary(req.file.path, "menu-items");
    }

    const menuItem = await createMenuItemService(req.body.cafeId, {
      ...req.body,
      image,
    });

    res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * UPDATE MENU ITEM
 * =========================================================
 */
export const updateMenuItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { itemId } = req.params;

    let updateData: any = { ...req.body };

    if (req.file) {
      updateData.image = await uploadToCloudinary(req.file.path, "menu-items");
    }

    const menuItem = await updateMenuItemService(itemId, updateData);

    res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * DELETE MENU ITEM
 * =========================================================
 */
export const deleteMenuItemController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { itemId } = req.params;

    await deleteMenuItemService(itemId);

    res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * =========================================================
 * TOGGLE MENU AVAILABILITY
 * =========================================================
 */
export const toggleMenuAvailabilityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { itemId } = req.params;

    const menuItem = await toggleMenuAvailabilityService(itemId);

    res.status(200).json({
      success: true,
      message: menuItem.isAvailable
        ? "Menu item is now available"
        : "Menu item is now unavailable",
      menuItem,
    });
  } catch (error) {
    next(error);
  }
};

// =========================================
// GET MY COMPLAINTS
// =========================================
export const getMyComplaintsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req?.user?.id as string;

    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const result = await getMyComplaintsService(
      userId,
      status,
      category,
      page,
      limit,
    );

    res.json({
      success: true,
      data: result.complaints,
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
