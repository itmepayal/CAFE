import { NotFoundError } from "../../utils/errors/app.error";
import {
  createSettlementForOrder,
  findOwnerTransactions,
  findSettlementsForAdmin,
  OwnerTransactionFilters,
  settleById,
  settlePendingOlderThan,
} from "./settlement.repository";
import { IOrder } from "../../models/order";
import { SettlementStatus } from "../../models/settlement";
import { logger } from "../../config/logger.config";

export const recordSettlementForCompletedOrder = async (
  order: IOrder,
): Promise<void> => {
  try {
    await createSettlementForOrder(order);
  } catch (error) {
    logger.error("Failed to create settlement for order", {
      orderId: order._id,
      error,
    });
  }
};

export const getOwnerTransactionsService = async (
  cafeId: string,
  filters: OwnerTransactionFilters,
) => {
  return findOwnerTransactions(cafeId, filters);
};

export const settleSettlementService = async (
  settlementId: string,
  adminId: string,
) => {
  try {
    return await settleById(settlementId, adminId);
  } catch {
    throw new NotFoundError("Settlement not found");
  }
};

export const autoSettlePendingSettlementsService = async (
  days: number = 7,
): Promise<number> => {
  const count = await settlePendingOlderThan(days);

  if (count > 0) {
    logger.info("Auto-settled pending settlements", { count, days });
  }

  return count;
};

export const getAdminSettlementsService = async (filters: {
  cafeId?: string;
  status?: SettlementStatus;
  page?: number;
  limit?: number;
}) => {
  return findSettlementsForAdmin(filters);
};
