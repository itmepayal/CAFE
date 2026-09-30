import { AppRole } from "../../middlewares/auth.middleware";
import { ForbiddenError } from "../errors/app.error";

/**
 * Centralized permission checks layered on top of RBAC.
 * Keep role gates in middleware; use these for sensitive action intent.
 */
export const PERMISSIONS = {
  ADMIN_MANAGE_CAFES: "admin.manage_cafes",
  ADMIN_MANAGE_ORDERS: "admin.manage_orders",
  ADMIN_REFUND: "admin.refund",
  ADMIN_SETTLE: "admin.settle",
  ADMIN_INVITE: "admin.invite",
  OWNER_MANAGE_ORDERS: "owner.manage_orders",
  OWNER_MANAGE_MENU: "owner.manage_menu",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<AppRole, ReadonlySet<Permission>> = {
  student: new Set(),
  cafe_owner: new Set([
    PERMISSIONS.OWNER_MANAGE_ORDERS,
    PERMISSIONS.OWNER_MANAGE_MENU,
  ]),
  admin: new Set([
    PERMISSIONS.ADMIN_MANAGE_CAFES,
    PERMISSIONS.ADMIN_MANAGE_ORDERS,
    PERMISSIONS.ADMIN_REFUND,
    PERMISSIONS.ADMIN_SETTLE,
  ]),
  super_admin: new Set(Object.values(PERMISSIONS)),
};

export const roleHasPermission = (
  role: string | undefined,
  permission: Permission,
): boolean => {
  if (!role) return false;
  const set = ROLE_PERMISSIONS[role as AppRole];
  return Boolean(set?.has(permission));
};

export const assertPermission = (
  role: string | undefined,
  permission: Permission,
): void => {
  if (!roleHasPermission(role, permission)) {
    throw new ForbiddenError("Insufficient permissions");
  }
};
