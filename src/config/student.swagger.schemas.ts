/**
 * OpenAPI component schemas — Student app (Gravly Figma).
 */
import { DEFAULT_DELIVERY_CHARGE } from "../modules/order/order.constant";

export const studentSwaggerSchemas = {
  StudentPagination: {
    type: "object",
    properties: {
      total: { type: "integer", example: 25 },
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 20 },
      totalPages: { type: "integer", example: 2 },
    },
  },

  StudentUser: {
    type: "object",
    properties: {
      _id: { type: "string" },
      name: { type: "string", example: "Rahul Sharma" },
      email: { type: "string", example: "rahul@university.edu" },
      phone: { type: "string", nullable: true, example: "9876543210" },
      profileImage: { type: "string" },
      university: { type: "string", example: "Nirma University" },
      hostel: { type: "string", example: "Boys Hostel A" },
      role: { type: "string", enum: ["student"], example: "student" },
    },
  },

  StudentHostel: {
    type: "object",
    properties: {
      id: { type: "string", example: "boys-hostel-a" },
      name: { type: "string", example: "Boys Hostel A" },
      area: { type: "string", example: "North Campus" },
    },
  },

  StudentCafeCard: {
    type: "object",
    description: "Home screen cafe card",
    properties: {
      _id: { type: "string" },
      cafeName: { type: "string", example: "Taj Cafe" },
      description: { type: "string" },
      cafeImage: { type: "string" },
      isOpen: { type: "boolean", example: true },
      rating: {
        type: "object",
        properties: {
          average: { type: "number", example: 4.5 },
          totalReviews: { type: "integer", example: 120 },
        },
      },
    },
  },

  StudentMenuItem: {
    type: "object",
    properties: {
      _id: { type: "string" },
      name: { type: "string", example: "Masala Rice" },
      category: { type: "string", example: "Main Course" },
      price: { type: "number", example: 51 },
      discountedPrice: { type: "number", nullable: true },
      effectivePrice: { type: "number", example: 51 },
      image: { type: "string" },
      isAvailable: { type: "boolean", example: true },
      isVeg: { type: "boolean" },
    },
  },

  StudentCart: {
    type: "object",
    properties: {
      cafeId: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            menuItemId: { type: "string" },
            itemName: { type: "string" },
            price: { type: "number" },
            quantity: { type: "integer" },
            subtotal: { type: "number" },
            specialInstructions: { type: "string" },
          },
        },
      },
      totalItems: { type: "integer", example: 2 },
      subtotal: { type: "number", example: 102 },
    },
  },

  StudentDeliveryAddress: {
    type: "object",
    description:
      "Figma cart address: fullAddress = Block+Room+Campus; hostelName = Block/Hostel; roomNumber = Room No; landmark optional; contactNumber accepts +91",
    properties: {
      fullAddress: {
        type: "string",
        example: "Block C, Room 204, University Campus",
      },
      hostelName: { type: "string", example: "Boys Hostel A" },
      roomNumber: { type: "string", example: "204" },
      landmark: { type: "string", example: "Near main gate" },
      contactNumber: { type: "string", example: "+91 9876543210" },
    },
    required: ["fullAddress", "contactNumber"],
  },

  StudentBillSummary: {
    type: "object",
    description: "Figma Bill Summary on checkout screens",
    properties: {
      subtotal: { type: "number", example: 102 },
      taxAmount: { type: "number", example: 5.1, description: "5% tax" },
      deliveryCharge: {
        type: "number",
        example: DEFAULT_DELIVERY_CHARGE,
        description: `₹${DEFAULT_DELIVERY_CHARGE} when orderType is delivery; 0 for pickup`,
      },
      discountAmount: { type: "number", example: 0 },
      totalAmount: { type: "number", example: 134.1 },
    },
  },

  StudentOrder: {
    type: "object",
    properties: {
      _id: { type: "string" },
      orderNumber: { type: "string", example: "ORD-20260903-0001" },
      cafeId: { $ref: "#/components/schemas/StudentCafeCard" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            itemName: { type: "string" },
            quantity: { type: "integer" },
            itemPrice: { type: "number" },
            subtotal: { type: "number" },
          },
        },
      },
      orderType: { type: "string", enum: ["pickup", "delivery"] },
      deliveryAddress: { $ref: "#/components/schemas/StudentDeliveryAddress" },
      subtotal: { type: "number" },
      taxAmount: { type: "number" },
      deliveryCharge: { type: "number", example: DEFAULT_DELIVERY_CHARGE },
      totalAmount: { type: "number" },
      paymentMethod: {
        type: "string",
        enum: ["cash", "upi", "card", "wallet"],
        description: "Send `online` as alias for UPI checkout",
      },
      paymentStatus: {
        type: "string",
        enum: ["pending", "paid", "failed", "refunded"],
      },
      status: {
        type: "string",
        enum: [
          "pending",
          "accepted",
          "preparing",
          "ready",
          "out_for_delivery",
          "completed",
          "cancelled",
          "rejected",
        ],
      },
      notes: { type: "string" },
      pickupCode: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
  },

  StudentCheckoutRequest: {
    type: "object",
    required: ["paymentMethod"],
    properties: {
      paymentMethod: {
        type: "string",
        enum: ["cash", "upi", "card", "wallet", "online"],
        description: "Figma: Online Payment or Cash on Delivery (COD)",
      },
      orderType: {
        type: "string",
        enum: ["pickup", "delivery"],
        default: "pickup",
        description: "Figma: Self Pickup (Free) vs Delivery (₹29)",
      },
      notes: {
        type: "string",
        maxLength: 500,
        description: "Figma: Order Notes (optional)",
      },
      deliveryAddress: {
        $ref: "#/components/schemas/StudentDeliveryAddress",
      },
    },
  },

  StudentSuccessResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      message: { type: "string" },
      data: { type: "object" },
    },
  },
};
