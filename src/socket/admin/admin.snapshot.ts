import {
  getDashboardStatsRepo,
  getPaymentsRepo,
} from "../../modules/admin/admin.repository";
import type {
  AdminDashboardStatsPayload,
  AdminPaymentSummaryPayload,
} from "./admin.types";

export interface AdminRealtimeSnapshot {
  stats: AdminDashboardStatsPayload;
  paymentSummary: AdminPaymentSummaryPayload;
}

export const fetchAdminRealtimeSnapshot =
  async (): Promise<AdminRealtimeSnapshot> => {
    const [stats, payments] = await Promise.all([
      getDashboardStatsRepo(),
      getPaymentsRepo(undefined, 1, 1),
    ]);

    return {
      stats: stats as AdminDashboardStatsPayload,
      paymentSummary: payments.summary,
    };
  };
