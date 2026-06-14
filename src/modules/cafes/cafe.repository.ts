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

// =========================================
// UPDATE CAFE BY USER ID
// =========================================
export const updateCafeByUserId = async (
  userId: string,
  data: Partial<ICafe>,
): Promise<ICafe | null> => {
  return await Cafe.findOneAndUpdate({ userId }, { $set: data }, { new: true });
};

// =========================================
// TOGGLE OPEN / CLOSE
// =========================================
export const toggleCafeOpen = async (userId: string): Promise<ICafe | null> => {
  const cafe = await Cafe.findOne({ userId });
  if (!cafe) return null;
  cafe.isOpen = !cafe.isOpen;
  return await cafe.save();
};

// =========================================
// FIND PENDING CAFES
// =========================================
export const findPendingCafes = async (): Promise<ICafe[]> => {
  return await Cafe.find({ status: "pending" }).sort({ createdAt: -1 }).lean();
};

// =========================================
// UPDATE CAFE STATUS (ADMIN)
// =========================================
export const updateCafeStatus = async (
  cafeId: string,
  status: "approved" | "rejected",
  adminNote: string,
  adminId: string,
): Promise<ICafe | null> => {
  const now = new Date();
  const update: any = {
    status,
    adminNote,
    approvedBy: adminId,
  };

  if (status === "approved") {
    update.approvedAt = now;
    update.rejectedAt = null;
  } else {
    update.rejectedAt = now;
    update.approvedAt = null;
  }

  return await Cafe.findByIdAndUpdate(cafeId, { $set: update }, { new: true });
};
