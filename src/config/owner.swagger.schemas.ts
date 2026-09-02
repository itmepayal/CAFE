/**
 * Reusable OpenAPI schemas for Cafe Owner (Gravly Figma) screens.
 */
export const ownerSwaggerSchemas = {
  Pagination: {
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
    description: "Returned in meta after POST /auth/cafe-owner/login — drives post-login navigation.",
    properties: {
      portal: { type: "string", enum: ["cafe_owner"], example: "cafe_owner" },
      redirectTo: {
        type: "string",
        enum: ["register_cafe", "pending_approval", "rejected", "dashboard"],
        description:
          "Figma routing: register_cafe → Step 1; pending_approval → waiting screen; rejected → rejection; dashboard → Active Orders",
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
    description: "Figma: Active Orders home header stats + online toggle state.",
    properties: {
      activeOrders: {
        type: "integer",
        description: "Orders in pending/accepted/preparing/ready/out_for_delivery",
        example: 3,
      },
      pendingOrders: {
        type: "integer",
        description: "Orders awaiting Accept/Decline",
        example: 1,
      },
      todayOrders: { type: "integer", example: 5 },
      todayRevenue: { type: "number", example: 1200 },
      totalRevenue: { type: "number", example: 45000 },
      completedToday: { type: "integer", example: 4 },
      isOpen: {
        type: "boolean",
        description: "Figma Online/Offline toggle — PATCH /owners/cafes/my-cafe/toggle-open",
        example: true,
      },
      cafeName: { type: "string", example: "HM Cafe" },
    },
  },

  OwnerTransaction: {
    type: "object",
    description: "Figma: Transaction History row (Order ID, Customer, Date, Amount, Settled badge).",
    properties: {
      orderId: { type: "string", example: "66f1a2b3c4d5e6f7a8b9c0d1" },
      orderNumber: { type: "string", example: "#2281" },
      customerName: { type: "string", example: "Rahul Sharma" },
      customerEmail: { type: "string", example: "rahul@example.com" },
      amount: { type: "number", example: 120 },
      paymentMethod: { type: "string", enum: ["upi", "card", "wallet", "cash"] },
      paymentStatus: { type: "string", enum: ["paid"] },
      settlementStatus: {
        type: "string",
        enum: ["pending", "settled"],
        description: "Figma green 'Settled' badge when settled",
      },
      settledAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
  },

  OwnerTransactionSummary: {
    type: "object",
    properties: {
      totalAmount: { type: "number", example: 5000 },
      settledAmount: { type: "number", example: 3200 },
      pendingAmount: { type: "number", example: 1800 },
      from: { type: "string", format: "date-time" },
      to: { type: "string", format: "date-time" },
    },
  },

  OwnerMenuItem: {
    type: "object",
    description: "Figma: Manage Menu list item with in-stock toggle.",
    properties: {
      _id: { type: "string" },
      cafeId: { type: "string" },
      category: { type: "string", example: "Nasta" },
      name: { type: "string", example: "Butter Toast" },
      description: { type: "string" },
      image: { type: "string" },
      price: { type: "number", example: 40 },
      discountedPrice: { type: "number", nullable: true },
      isAvailable: {
        type: "boolean",
        description: "Figma in-stock/out-of-stock toggle",
        example: true,
      },
      isVeg: { type: "boolean" },
      preparationTime: { type: "integer" },
      displayOrder: { type: "integer" },
    },
  },

  OwnerOrder: {
    type: "object",
    description: "Figma: Active Orders card (#24225, items, total, Accept/Reject).",
    properties: {
      _id: { type: "string" },
      orderNumber: { type: "string", example: "#24225" },
      status: {
        type: "string",
        enum: [
          "pending",
          "accepted",
          "rejected",
          "preparing",
          "ready",
          "out_for_delivery",
          "completed",
          "cancelled",
        ],
      },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            itemName: { type: "string", example: "Butter Toast" },
            quantity: { type: "integer", example: 1 },
            itemPrice: { type: "number", example: 40 },
            subtotal: { type: "number", example: 40 },
          },
        },
      },
      totalAmount: { type: "number", example: 165 },
      paymentStatus: { type: "string" },
      orderType: { type: "string", enum: ["pickup", "delivery"] },
      createdAt: { type: "string", format: "date-time" },
      studentId: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
        },
      },
    },
  },

  CafeRegistrationDraft: {
    type: "object",
    description:
      "Multi-step onboarding draft mapped to Figma registration. Step 5 via PUT /cafes/register/draft/5 then POST /draft/submit.",
    properties: {
      currentStep: { type: "integer", minimum: 1, maximum: 5, example: 3 },
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
          street: { type: "string" },
          area: { type: "string" },
          landmark: { type: "string" },
          city: { type: "string" },
          pincode: { type: "string" },
          latitude: { type: "number" },
          longitude: { type: "number" },
        },
      },
      step3: {
        type: "object",
        description: "Figma Step 3 — Finance & Verification",
        properties: {
          gstId: { type: "string", description: "Optional GST ID" },
          upiId: { type: "string" },
          accountHolderName: { type: "string" },
          accountNumber: { type: "string" },
          bankName: { type: "string" },
          ifscCode: { type: "string" },
        },
      },
      step4: {
        type: "object",
        description:
          "Figma Step 4: fssaiCertificate=Cafe/Food License; gallery=Menu & Cafe Photos; layoutPhotos=layout/table",
        properties: {
          cafeImage: { type: "string" },
          menuImage: { type: "string" },
          gallery: { type: "array", items: { type: "string" } },
          layoutPhotos: { type: "array", items: { type: "string" } },
          aadharNumber: { type: "string" },
          panNumber: { type: "string" },
          fssaiNumber: { type: "string" },
        },
      },
      step5: {
        type: "object",
        description: "Figma Step 5 — Final review before submit",
        properties: {
          registrationFeedback: {
            type: "string",
            description: "How's your experience?",
          },
          socialMedia: {
            type: "object",
            properties: {
              instagram: { type: "string" },
              facebook: { type: "string" },
              website: { type: "string" },
            },
          },
        },
      },
    },
  },

  OwnerCafeProfile: {
    type: "object",
    description: "Figma: Profile tab — combine GET /auth/me + GET /owners/cafes/my-cafe",
    properties: {
      cafeName: { type: "string" },
      ownerName: { type: "string" },
      mobile: { type: "string" },
      email: { type: "string" },
      description: { type: "string" },
      isOpen: { type: "boolean" },
      status: { type: "string", enum: ["approved"] },
      bankDetails: {
        type: "object",
        properties: {
          accountHolderName: { type: "string" },
          bankName: { type: "string" },
          ifscCode: { type: "string" },
          upiId: { type: "string" },
          gstId: { type: "string" },
        },
      },
      socialMedia: {
        type: "object",
        properties: {
          instagram: { type: "string" },
          facebook: { type: "string" },
          website: { type: "string" },
        },
      },
      gallery: { type: "array", items: { type: "string" } },
      layoutPhotos: { type: "array", items: { type: "string" } },
    },
  },

  OwnerSocketDocumentation: {
    type: "object",
    description: "Socket.IO events for cafe owner real-time screens.",
  },
};
