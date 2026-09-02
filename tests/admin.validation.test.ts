import { describe, expect, it } from "vitest";
import {
  getAllCafesSchema,
  getPaymentsSchema,
} from "../src/modules/admin/admin.validation";

describe("admin.validation", () => {
  it("accepts payments query with optional status filter", () => {
    const result = getPaymentsSchema.safeParse({
      query: {
        paymentStatus: "paid",
        page: "1",
        limit: "20",
      },
    });

    expect(result.success).toBe(true);
  });

  it("accepts cafes query with status and search", () => {
    const result = getAllCafesSchema.safeParse({
      query: {
        status: "approved",
        search: "moonlight",
        isBlocked: "false",
        page: "1",
        limit: "10",
      },
    });

    expect(result.success).toBe(true);
  });
});
