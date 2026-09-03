import { describe, expect, it } from "vitest";
import {
  registerCafeSchema,
  saveDraftStep1Schema,
  saveDraftStep3Schema,
  collectFigmaRegistrationMediaErrors,
  REGISTRATION_MIN_LAYOUT_PHOTOS,
} from "../src/modules/cafes/cafe.validation";
import {
  getOwnerTransactionsSchema,
  rejectOrderSchema,
  createMenuItemSchema,
  getMyCafeOrdersSchema,
} from "../src/modules/owner/owner.validation";
import { DEFAULT_ORDER_REJECT_REASON } from "../src/utils/validation/indian-fields";

describe("cafe owner registration validation", () => {
  it("requires financial fields on single-shot register", () => {
    const result = registerCafeSchema.safeParse({
      body: {
        cafeName: "HM Cafe",
        ownerName: "Tejash",
        mobile: "9876543210",
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts mobile with +91 prefix on step 1", () => {
    const result = saveDraftStep1Schema.safeParse({
      body: {
        cafeName: "HM Cafe",
        ownerName: "Tejash",
        mobile: "+91 9876543210",
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.mobile).toBe("9876543210");
    }
  });

  it("accepts Figma step 3 with optional gstId", () => {
    const result = saveDraftStep3Schema.safeParse({
      body: {
        accountHolderName: "Tejash",
        accountNumber: "123456789",
        confirmAccountNumber: "123456789",
        bankName: "HDFC Bank",
        ifscCode: "HDFC0001234",
      },
    });

    expect(result.success).toBe(true);
  });

  it("normalizes lowercase IFSC on step 3", () => {
    const result = saveDraftStep3Schema.safeParse({
      body: {
        accountHolderName: "Tejash",
        accountNumber: "123456789",
        confirmAccountNumber: "123456789",
        ifscCode: "hdfc0001234",
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.ifscCode).toBe("HDFC0001234");
    }
  });

  it("rejects mismatched account numbers on step 3", () => {
    const result = saveDraftStep3Schema.safeParse({
      body: {
        accountHolderName: "Tejash",
        accountNumber: "123456789",
        confirmAccountNumber: "987654321",
        ifscCode: "HDFC0001234",
      },
    });

    expect(result.success).toBe(false);
  });

  it("validates Figma step 4–5 media on submit", () => {
    const errors = collectFigmaRegistrationMediaErrors({
      ownerPhoto: "",
      layoutPhotos: ["one.jpg"],
      shopEstablishmentCertificate: "",
      bankPassbookPhoto: "",
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes(`${REGISTRATION_MIN_LAYOUT_PHOTOS}`))).toBe(
      true,
    );
  });
});

describe("cafe owner menu validation", () => {
  it("accepts Figma add item with name and price only", () => {
    const result = createMenuItemSchema.safeParse({
      body: {
        name: "Butter Toast",
        price: 30,
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.category).toBe("General");
    }
  });
});

describe("cafe owner order validation", () => {
  it("accepts decline without reason (Figma simple Decline)", () => {
    const result = rejectOrderSchema.safeParse({
      params: { orderId: "507f1f77bcf86cd799439011" },
      body: {},
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.reason).toBe(DEFAULT_ORDER_REJECT_REASON);
    }
  });

  it("accepts active orders query for Figma Active Orders tab", () => {
    const result = getMyCafeOrdersSchema.safeParse({
      query: { active: "true", page: "1", limit: "10" },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query.active).toBe(true);
    }
  });
});

describe("cafe owner transactions validation", () => {
  it("accepts settlement status filter", () => {
    const result = getOwnerTransactionsSchema.safeParse({
      query: { settlementStatus: "settled", page: "1", limit: "20" },
    });

    expect(result.success).toBe(true);
  });

  it("accepts all-time query without date range", () => {
    const result = getOwnerTransactionsSchema.safeParse({
      query: { page: "1", limit: "20" },
    });

    expect(result.success).toBe(true);
  });
});
