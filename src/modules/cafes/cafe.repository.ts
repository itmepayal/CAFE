import Cafe, { ICafe } from "../../models/cafe";

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
): Promise<{ cafes: ICafe[]; total: number; page: number; limit: number }> => {
  const filter: any = {
    status: "approved",
    isBlocked: false,
  };

  if (search) {
    filter.cafeName = { $regex: search, $options: "i" };
  }

  if (city) {
    filter["address.city"] = { $regex: city, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const [cafes, total] = await Promise.all([
    Cafe.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
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

// =========================================
// FIND CAFE BY USER ID
// =========================================
export const findCafeByUserId = async (
  userId: string,
): Promise<ICafe | null> => {
  return await Cafe.findOne({ userId });
};
