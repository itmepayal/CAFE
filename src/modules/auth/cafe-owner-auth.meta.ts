import { findCafeByUserId } from "../cafes/cafe.repository";

export type CafeOwnerRegistrationStatus =
  | "not_registered"
  | "pending"
  | "rejected"
  | "approved";

export type CafeOwnerRedirectTarget =
  | "register_cafe"
  | "pending_approval"
  | "rejected"
  | "dashboard";

export interface CafeOwnerLoginMeta {
  portal: "cafe_owner";
  redirectTo: CafeOwnerRedirectTarget;
  cafeStatus: CafeOwnerRegistrationStatus;
  cafeId?: string;
}

export const resolveCafeOwnerLoginMeta = async (
  userId: string,
  role: string,
): Promise<CafeOwnerLoginMeta> => {
  const cafe = await findCafeByUserId(userId);

  if (!cafe) {
    return {
      portal: "cafe_owner",
      redirectTo: "register_cafe",
      cafeStatus: "not_registered",
    };
  }

  const cafeId = cafe._id.toString();

  if (cafe.status === "pending") {
    return {
      portal: "cafe_owner",
      redirectTo: "pending_approval",
      cafeStatus: "pending",
      cafeId,
    };
  }

  if (cafe.status === "rejected") {
    return {
      portal: "cafe_owner",
      redirectTo: "rejected",
      cafeStatus: "rejected",
      cafeId,
    };
  }

  if (role === "cafe_owner" && cafe.status === "approved") {
    return {
      portal: "cafe_owner",
      redirectTo: "dashboard",
      cafeStatus: "approved",
      cafeId,
    };
  }

  return {
    portal: "cafe_owner",
    redirectTo: "pending_approval",
    cafeStatus: "pending",
    cafeId,
  };
};
