import { describe, expect, it } from "vitest";
import {
  registerCafeSchema,
  saveDraftStep3Schema,
} from "../src/modules/cafes/cafe.validation";
import { getOwnerTransactionsSchema } from "../src/modules/owner/owner.validation";
import { getSettlementsSchema } from "../src/modules/admin/admin.validation";

describe("cafe.validation", () => {
  it("requires bankName on cafe registration", () => {
    const result = registerCafeSchema.safeParse({
      body: {
        cafeName: "HM Cafe",
        ownerName: "Tejash",
        mobile: "9876543210",
        aadharNumber: "234567890123",
        panNumber: "ABCDE1234F",
        fssaiNumber: "12345678901234",
        accountHolderName: "Tejash",
        accountNumber: "123456789",
        ifscCode: "HDFC0001234",
        upiId: "tejash@upi",
      },
    });

    expect(result.success).toBe(false);
  });

  it("accepts registration with bankName and matching account numbers", () => {
    const result = registerCafeSchema.safeParse({
      body: {
        cafeName: "HM Cafe",
        ownerName: "Tejash",
        mobile: "9876543210",
        aadharNumber: "234567890123",
        panNumber: "ABCDE1234F",
        fssaiNumber: "12345678901234",
        accountHolderName: "Tejash",
        accountNumber: "123456789",
        confirmAccountNumber: "123456789",
        bankName: "HDFC Bank",
        ifscCode: "HDFC0001234",
        upiId: "tejash@upi",
      },
    });

    expect(result.success).toBe(true);
  });

  it("validates draft step 3 account confirmation", () => {
    const result = saveDraftStep3Schema.safeParse({
      body: {
        accountHolderName: "Tejash",
        accountNumber: "123456789",
        confirmAccountNumber: "987654321",
        bankName: "HDFC Bank",
        ifscCode: "HDFC0001234",
        upiId: "tejash@upi",
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("owner transactions validation", () => {
  it("accepts owner transactions query with settlement status", () => {
    const result = getOwnerTransactionsSchema.safeParse({
      query: {
        settlementStatus: "settled",
        page: "1",
        limit: "20",
      },
    });

    expect(result.success).toBe(true);
  });
});

describe("admin settlements validation", () => {
  it("accepts settlements query filters", () => {
    const result = getSettlementsSchema.safeParse({
      query: {
        status: "pending",
        page: "1",
        limit: "10",
      },
    });

    expect(result.success).toBe(true);
  });
});
