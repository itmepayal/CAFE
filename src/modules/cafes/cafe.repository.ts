import Cafe, { ICafe } from "../../models/cafe";

const PUBLIC_CAFE_PROJECTION = [
  "cafeName",
  "ownerName",
  "description",
  "address",
  "location",
  "cafeImage",
  "menuImage",
  "gallery",
  "layoutPhotos",
  "interiorPhotos",
  "exteriorPhotos",
  "socialMedia",
  "isOpen",
  "isVisible",
  "isFeatured",
  "supportsDelivery",
  "status",
  "rating",
  "createdAt",
  "updatedAt",
].join(" ");

const addPublicVirtuals = <T extends { status: string }>(cafe: T) => ({
  ...cafe,
  isApproved: cafe.status === "approved",
});

// =========================================
// CREATE CAFE
// =========================================
export const createCafe = async (data: Partial<ICafe>): Promise<ICafe> => {
  return await Cafe.create(data);
};

// =========================================
// FIND APPROVED CAFES
// =========================================
export const findApprovedCafes = async (
  search?: string,
  city?: string,
  page: number = 1,
  limit: number = 10,
  isOpen?: boolean,
): Promise<{ cafes: ICafe[]; total: number; page: number; limit: number }> => {
  const filter: any = {
    status: "approved",
    isBlocked: false,
    isVisible: true,
  };

  if (typeof isOpen === "boolean") {
    filter.isOpen = isOpen;
  }

  if (search) {
    filter.cafeName = { $regex: search, $options: "i" };
  }

  if (city) {
    filter["address.city"] = { $regex: city, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const [cafes, total] = await Promise.all([
    Cafe.find(filter)
      .select(PUBLIC_CAFE_PROJECTION)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .then((results) => results.map((cafe) => addPublicVirtuals(cafe))),
    Cafe.countDocuments(filter),
  ]);

  return { cafes, total, page, limit };
};

// =========================================
// FIND CAFE BY ID
// =========================================
export const findCafeById = async (id: string): Promise<ICafe | null> => {
  return await Cafe.findById(id).lean();
};

export const findPublicCafeById = async (id: string) => {
  const cafe = await Cafe.findById(id).select(PUBLIC_CAFE_PROJECTION).lean();
  return cafe ? addPublicVirtuals(cafe) : null;
};

// =========================================
// FIND CAFE BY USER ID
// =========================================
export const findCafeByUserId = async (
  userId: string,
): Promise<ICafe | null> => {
  return await Cafe.findOne({ userId });
};

// =========================================
// UPDATE CAFE
// =========================================
export const updatedCafe = async (cafeId: string, payload: any) => {
  return await Cafe.findByIdAndUpdate(cafeId, payload, {
    new: true,
  });
};

export const applyCafeRatingRepo = async (
  cafeId: string,
  stars: number,
): Promise<void> => {
  const cafe = await Cafe.findById(cafeId).select("rating");
  if (!cafe) return;

  const totalReviews = (cafe.rating?.totalReviews ?? 0) + 1;
  const previousAverage = cafe.rating?.average ?? 0;
  const average =
    totalReviews === 1
      ? stars
      : (previousAverage * (totalReviews - 1) + stars) / totalReviews;

  await Cafe.findByIdAndUpdate(cafeId, {
    $set: {
      "rating.average": parseFloat(average.toFixed(2)),
      "rating.totalReviews": totalReviews,
    },
  });
};
