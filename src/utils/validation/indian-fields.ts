import { z } from "zod";

/** Strips +91 / spaces and keeps 10-digit Indian mobile. */
export const normalizeIndianMobile = (value: string): string =>
  value.trim().replace(/^\+91/, "").replace(/\D/g, "");

export const normalizeIfsc = (value: string): string =>
  value.trim().toUpperCase();

export const indianMobileSchema = z
  .string()
  .transform(normalizeIndianMobile)
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile number"));

export const ifscSchema = z
  .string()
  .transform(normalizeIfsc)
  .pipe(z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"));

export const DEFAULT_ORDER_REJECT_REASON = "Declined by cafe owner";
