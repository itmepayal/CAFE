import type { ICafe } from "../../models/cafe";
import { getOwnerDashboardStatsRepo } from "../../modules/owner/owner.repository";
import type { OwnerDashboardStatsPayload } from "./owner.types";

export const fetchOwnerDashboardStats = async (
  cafe: ICafe,
): Promise<OwnerDashboardStatsPayload> => getOwnerDashboardStatsRepo(cafe);
