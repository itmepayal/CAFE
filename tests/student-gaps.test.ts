import { describe, expect, it } from "vitest";
import {
  createOrderSchema,
  createOrderFromCartSchema,
  getMyOrdersSchema,
} from "../src/modules/order/order.validation";
import { getCafeQuerySchema } from "../src/modules/cafes/cafe.validation";
import { updateProfileSchema } from "../src/modules/auth/auth.validation";
import { DEFAULT_DELIVERY_CHARGE } from "../src/modules/order/order.constant";

describe("student order validation", () => {
  it("accepts online as payment alias", () => {
    const result = createOrderSchema.safeParse({
      body: {
        cafeId: "507f1f77bcf86cd799439011",
        items: [{ menuItemId: "507f1f77bcf86cd799439012", quantity: 1 }],
        paymentMethod: "online",
        orderType: "pickup",
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.paymentMethod).toBe("upi");
    }
  });

  it("normalizes +91 on delivery contact number", () => {
    const result = createOrderSchema.safeParse({
      body: {
        cafeId: "507f1f77bcf86cd799439011",
        items: [{ menuItemId: "507f1f77bcf86cd799439012", quantity: 1 }],
        paymentMethod: "cash",
        orderType: "delivery",
        deliveryAddress: {
          fullAddress: "Boys Hostel A, Room 204",
          contactNumber: "+91 9876543210",
          hostelName: "Boys Hostel A",
          roomNumber: "204",
        },
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.deliveryAddress?.contactNumber).toBe("9876543210");
    }
  });

  it("validates checkout from cart body", () => {
    const result = createOrderFromCartSchema.safeParse({
      body: {
        paymentMethod: "cash",
        orderType: "pickup",
      },
    });

    expect(result.success).toBe(true);
  });

  it("supports active and history filters on my-orders", () => {
    const active = getMyOrdersSchema.safeParse({
      query: { active: "true", page: "1" },
    });
    const history = getMyOrdersSchema.safeParse({
      query: { history: "true", orderType: "delivery" },
    });

    expect(active.success).toBe(true);
    expect(history.success).toBe(true);
  });

  it("keeps delivery charge constant at ₹29", () => {
    expect(DEFAULT_DELIVERY_CHARGE).toBe(29);
  });
});

describe("student cafe discovery validation", () => {
  it("accepts isOpen filter on cafe list", () => {
    const result = getCafeQuerySchema.safeParse({
      query: { isOpen: "true", page: "1", limit: "10" },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query.isOpen).toBe(true);
    }
  });
});

describe("student profile validation", () => {
  it("accepts hostel on profile update", () => {
    const result = updateProfileSchema.safeParse({
      body: {
        hostel: "Boys Hostel A",
        phone: "+91 9876543210",
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.hostel).toBe("Boys Hostel A");
      expect(result.data.body.phone).toBe("9876543210");
    }
  });
});
