/**
 * Reusable OpenAPI schemas for Super Admin (Figma) screens.
 */
export const adminSwaggerSchemas = {
  Pagination: {
    type: "object",
    properties: {
      total: { type: "integer", example: 50 },
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 10 },
      totalPages: { type: "integer", example: 5 },
    },
  },

  AdminDashboardStats: {
    type: "object",
    properties: {
      totalEarnings: {
        type: "number",
        description: "Total paid revenue (Figma: Total Earnings)",
        example: 300,
      },
      totalCollection: {
        type: "number",
        description: "Alias of totalEarnings",
        example: 300,
      },
      activeOrders: {
        type: "integer",
        description: "In-progress orders (pending → out_for_delivery)",
        example: 0,
      },
      totalOrders: {
        type: "integer",
        description: "All orders count",
        example: 3,
      },
      totalUsers: {
        type: "integer",
        description: "Active users (Figma: All Users card)",
        example: 120,
      },
      allUsersCount: { type: "integer", example: 120 },
      allOrdersCount: { type: "integer", example: 3 },
      activeCafes: {
        type: "integer",
        description: "Approved, unblocked cafes",
        example: 8,
      },
      openCafes: {
        type: "integer",
        description: "Currently open and visible cafes",
        example: 5,
      },
      totalCafes: { type: "integer", example: 10 },
      pendingCafeRequests: {
        type: "integer",
        description: "Figma: New Cafe Requests count",
        example: 5,
      },
      todayOrders: { type: "integer", example: 2 },
      orderStatusCounts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            _id: { type: "string", example: "completed" },
            count: { type: "integer", example: 10 },
          },
        },
      },
    },
  },

  AdminPaymentSummary: {
    type: "object",
    properties: {
      totalCollection: { type: "number", example: 400 },
      successCount: { type: "integer", example: 2 },
      pendingCount: { type: "integer", example: 1 },
      failedCount: { type: "integer", example: 0 },
      refundedCount: { type: "integer", example: 0 },
    },
  },

  AdminPaymentTransaction: {
    type: "object",
    properties: {
      orderId: { type: "string", example: "665c12345678901234567890" },
      orderNumber: { type: "string", example: "ORD-20250902-001" },
      paymentId: { type: "string", example: "pay_M3S8K2..." },
      userName: { type: "string", example: "Shubham Vakil" },
      userEmail: { type: "string", example: "shubham@example.com" },
      cafeName: { type: "string", example: "HR Cafe" },
      paymentMethod: {
        type: "string",
        enum: ["upi", "card", "wallet", "cash"],
        example: "upi",
      },
      amount: { type: "number", example: 100 },
      paymentStatus: {
        type: "string",
        enum: ["pending", "paid", "failed", "refunded"],
        example: "paid",
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },

  AdminCafeListItem: {
    allOf: [{ $ref: "#/components/schemas/Cafe" }],
    type: "object",
    properties: {
      statusLabel: {
        type: "string",
        enum: ["OPEN", "CLOSED"],
        example: "OPEN",
      },
      userId: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string" },
        },
      },
    },
  },

  AdminLoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", example: "admin@gravly.com" },
      password: {
        type: "string",
        format: "password",
        minLength: 8,
        example: "SecurePass123",
      },
    },
  },

  AdminRegisterRequest: {
    type: "object",
    required: ["name", "email", "password", "inviteToken"],
    properties: {
      name: { type: "string", example: "Admin User" },
      email: { type: "string", format: "email", example: "admin@gravly.com" },
      password: {
        type: "string",
        format: "password",
        minLength: 8,
        example: "SecurePass123",
      },
      inviteToken: {
        type: "string",
        description: "From POST /admin/invites or ADMIN_BOOTSTRAP_TOKEN",
      },
    },
  },

  AuthTokenResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      message: { type: "string", example: "Admin login successful" },
      data: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
          token: {
            type: "string",
            description: "Alias of accessToken for mobile Bearer auth",
          },
          portal: { type: "string", example: "admin" },
          redirectTo: { type: "string", example: "dashboard" },
        },
      },
    },
  },

  User: {
    type: "object",
    properties: {
      _id: { type: "string" },
      name: { type: "string", example: "Shubham Vakil" },
      email: { type: "string", format: "email", example: "shubham@example.com" },
      profileImage: { type: "string" },
      role: {
        type: "string",
        enum: ["student", "cafe_owner", "super_admin"],
      },
      phone: { type: "string", nullable: true },
      university: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
    },
  },

  AdminOrder: {
    type: "object",
    properties: {
      _id: { type: "string" },
      orderNumber: { type: "string", example: "ORD-001" },
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
      orderType: { type: "string", enum: ["pickup", "delivery"] },
      totalAmount: { type: "number", example: 100 },
      paymentStatus: {
        type: "string",
        enum: ["pending", "paid", "failed", "refunded"],
      },
      paymentMethod: {
        type: "string",
        enum: ["upi", "card", "wallet", "cash"],
      },
      studentId: { $ref: "#/components/schemas/User" },
      cafeId: {
        type: "object",
        properties: {
          _id: { type: "string" },
          cafeName: { type: "string", example: "HR Cafe" },
        },
      },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            itemName: { type: "string" },
            quantity: { type: "integer" },
            itemPrice: { type: "number" },
          },
        },
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },

  RejectCafeRequest: {
    type: "object",
    required: ["adminNote"],
    properties: {
      adminNote: {
        type: "string",
        example: "Incomplete FSSAI documents",
        maxLength: 500,
      },
    },
  },

  AdminSocketDocumentation: {
    type: "object",
    description: "Socket.IO admin events reference (not an HTTP endpoint)",
    properties: {
      protocolVersion: { type: "integer", example: 1 },
      envelope: {
        type: "object",
        properties: {
          meta: {
            type: "object",
            properties: {
              eventId: { type: "string", format: "uuid" },
              event: { type: "string", example: "admin:dashboard:updated" },
              timestamp: { type: "string", format: "date-time" },
              version: { type: "integer", example: 1 },
              reason: { type: "string", example: "order" },
            },
          },
          data: { type: "object" },
        },
      },
      connection: {
        type: "object",
        properties: {
          url: { type: "string", example: "ws://localhost:8000" },
          auth: {
            type: "object",
            properties: {
              token: { type: "string", description: "JWT accessToken" },
            },
          },
          autoJoin: {
            type: "boolean",
            example: true,
            description: "super_admin auto-joins admins room on connect",
          },
        },
      },
      events: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", example: "admin:dashboard:updated" },
            screen: { type: "string", example: "Dashboard" },
            payload: { type: "object" },
          },
        },
      },
    },
  },

  AdminCafeSocketPayload: {
    type: "object",
    properties: {
      cafeId: { type: "string" },
      cafeName: { type: "string", example: "Moonlight Cafe" },
      ownerName: { type: "string", example: "Vishu Kumar" },
      status: { type: "string", enum: ["pending", "approved", "rejected"] },
      isOpen: { type: "boolean" },
      isVisible: { type: "boolean" },
      isBlocked: { type: "boolean" },
      statusLabel: { type: "string", enum: ["OPEN", "CLOSED"] },
      action: {
        type: "string",
        enum: [
          "request_submitted",
          "approved",
          "rejected",
          "blocked",
          "unblocked",
          "visibility_toggled",
          "open_toggled",
        ],
      },
    },
  },

  AdminUserRegisteredPayload: {
    type: "object",
    properties: {
      userId: { type: "string" },
      name: { type: "string", example: "Shubham Vakil" },
      email: { type: "string", format: "email" },
      role: { type: "string", example: "student" },
      provider: { type: "string", enum: ["google", "apple", "email"] },
    },
  },
};
