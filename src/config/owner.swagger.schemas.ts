/**
 * OpenAPI component schemas — Cafe Owner (Gravly Figma).
 */
export const ownerSwaggerSchemas = {
  OwnerPagination: {
    type: "object",
    properties: {
      total: { type: "integer", example: 25 },
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 20 },
      totalPages: { type: "integer", example: 2 },
    },
  },

  CafeOwnerLoginMeta: {
    type: "object",
    description: "Present at response root `meta` and inside `data` after login.",
    properties: {
      portal: { type: "string", enum: ["cafe_owner"], example: "cafe_owner" },
      redirectTo: {
        type: "string",
        enum: ["register_cafe", "pending_approval", "rejected", "dashboard"],
      },
      cafeStatus: {
        type: "string",
        enum: ["not_registered", "pending", "rejected", "approved"],
      },
      cafeId: { type: "string", nullable: true },
    },
  },

  CafeOwnerDashboard: {
    type: "object",
    properties: {
      activeOrders: { type: "integer", example: 3 },
      pendingOrders: { type: "integer", example: 1 },
      todayOrders: { type: "integer", example: 5 },
      todayRevenue: { type: "number", example: 1200 },
      totalRevenue: { type: "number", example: 45000 },
      completedToday: { type: "integer", example: 4 },
      isOpen: { type: "boolean", example: true },
      cafeName: { type: "string", example: "HM Cafe" },
    },
  },

  OwnerTransaction: {
    type: "object",
    properties: {
      transactionId: {
        type: "string",
        description: "Settlement record ID (Figma #T1001 style prefix on client)",
        example: "66f1a2b3c4d5e6f7a8b9c0d2",
      },
      orderId: { type: "string" },
      orderNumber: { type: "string", example: "#2281" },
      customerName: { type: "string", example: "Rahul Sharma" },
      amount: { type: "number", example: 120 },
      status: {
        type: "string",
        enum: ["Settled", "Pending"],
        description: "Figma badge label",
      },
      settlementStatus: {
        type: "string",
        enum: ["settled", "pending"],
      },
      settledAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
  },

  OwnerTransactionSummary: {
    type: "object",
    properties: {
      totalAmount: { type: "number" },
      settledAmount: { type: "number" },
      pendingAmount: { type: "number" },
      from: { type: "string", format: "date-time", nullable: true },
      to: { type: "string", format: "date-time", nullable: true },
    },
  },
  OwnerMenuItem: {
    type: "object",
    properties: {
      _id: { type: "string" },
      name: { type: "string", example: "Butter Toast" },
      price: { type: "number", example: 30 },
      isAvailable: { type: "boolean", example: true },
      category: { type: "string" },
      image: { type: "string" },
    },
  },

  OwnerOrder: {
    type: "object",
    properties: {
      _id: { type: "string" },
      orderNumber: { type: "string", example: "#2452" },
      status: {
        type: "string",
        enum: [
          "pending",
          "accepted",
          "preparing",
          "ready",
          "completed",
          "rejected",
          "cancelled",
        ],
      },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            itemName: { type: "string" },
            quantity: { type: "integer" },
            subtotal: { type: "number" },
          },
        },
      },
      totalAmount: { type: "number", example: 165 },
      createdAt: { type: "string", format: "date-time" },
    },
  },

  OwnerSuccessResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      message: { type: "string" },
      data: { type: "object" },
    },
  },
};
