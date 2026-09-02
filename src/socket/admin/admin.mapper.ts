import type {
  AdminCafeAction,
  AdminCafeSocketPayload,
  AdminPaymentSocketPayload,
} from "./admin.types";

export const toAdminCafePayload = (
  cafe: {
    _id: { toString(): string } | string;
    cafeName?: string;
    ownerName?: string;
    status?: string;
    isOpen?: boolean;
    isVisible?: boolean;
    isBlocked?: boolean;
  },
  action: AdminCafeAction,
): AdminCafeSocketPayload => {
  const isOpen = cafe.isOpen ?? false;

  return {
    cafeId: typeof cafe._id === "string" ? cafe._id : cafe._id.toString(),
    cafeName: cafe.cafeName ?? "",
    ownerName: cafe.ownerName,
    status: cafe.status ?? "pending",
    isOpen,
    isVisible: cafe.isVisible ?? false,
    isBlocked: cafe.isBlocked ?? false,
    statusLabel: isOpen ? "OPEN" : "CLOSED",
    action,
  };
};

export const toAdminPaymentPayload = (order: {
  _id: { toString(): string } | string;
  orderNumber: string;
  paymentId?: string;
  studentId?:
    | { name?: string; email?: string }
    | string
    | { toString(): string };
  cafeId?: { cafeName?: string } | string | { toString(): string };
  paymentMethod: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt?: Date;
}): AdminPaymentSocketPayload => {
  const student =
    typeof order.studentId === "object" &&
    order.studentId !== null &&
    "name" in order.studentId
      ? order.studentId
      : undefined;
  const cafe =
    typeof order.cafeId === "object" &&
    order.cafeId !== null &&
    "cafeName" in order.cafeId
      ? order.cafeId
      : undefined;

  return {
    orderId:
      typeof order._id === "string" ? order._id : order._id.toString(),
    orderNumber: order.orderNumber,
    paymentId: order.paymentId || order.orderNumber,
    userName: student?.name ?? "",
    userEmail: student?.email ?? "",
    cafeName: cafe?.cafeName ?? "",
    paymentMethod: order.paymentMethod,
    amount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
  };
};
