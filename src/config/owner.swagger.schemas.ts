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

  CafeRegistrationDraft: {
    type: "object",
    properties: {
      currentStep: { type: "integer", minimum: 1, maximum: 5 },
      step1: {
        type: "object",
        description: "Figma Step 1 — Cafe Details",
        properties: {
          cafeName: { type: "string" },
          ownerName: { type: "string" },
          description: { type: "string" },
          mobile: { type: "string" },
          email: { type: "string" },
        },
      },
      step2: {
        type: "object",
        description: "Figma Step 2 — Location",
        properties: {
          searchLocation: { type: "string" },
          street: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          pincode: { type: "string" },
          landmark: { type: "string" },
        },
      },
      step3: {
        type: "object",
        description: "Figma Step 3 — Financials (GST optional)",
        properties: {
          gstId: { type: "string", example: "22AAAAA0000A1Z5" },
          accountHolderName: { type: "string" },
          bankName: { type: "string" },
          accountNumber: { type: "string" },
          ifscCode: { type: "string" },
        },
      },
      step4: {
        type: "object",
        description: "Figma Step 4 — Owner photo + layout/cafe photos (min 2)",
        properties: {
          ownerPhoto: { type: "string" },
          layoutPhotos: { type: "array", items: { type: "string" } },
        },
      },
      step5: {
        type: "object",
        description: "Figma Step 5 — Shop establishment + bank passbook",
        properties: {
          shopEstablishmentCertificate: { type: "string" },
          bankPassbookPhoto: { type: "string" },
        },
      },
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
