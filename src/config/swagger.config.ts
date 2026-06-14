import swaggerJsdoc from "swagger-jsdoc";
import { serverConfig } from "../config";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Gravil Backend API",
      version: "1.0.0",
      description: "Gravil Backend API Documentation",
    },

    servers: [
      {
        url: serverConfig.API_BASE_URL,
        description:
          process.env.NODE_ENV === "production"
            ? "Production Server"
            : "Development Server",
      },
    ],

    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
        },
      },

      schemas: {
        Cafe: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            cafeName: {
              type: "string",
            },
            ownerName: {
              type: "string",
            },
            description: {
              type: "string",
            },
            mobile: {
              type: "string",
            },
            email: {
              type: "string",
              format: "email",
            },
            status: {
              type: "string",
              enum: ["pending", "approved", "rejected"],
            },
            isOpen: {
              type: "boolean",
            },
            isBlocked: {
              type: "boolean",
            },
            rating: {
              type: "object",
              properties: {
                average: {
                  type: "number",
                },
                totalReviews: {
                  type: "number",
                },
              },
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        UpdateCafeStatus: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["approved", "rejected"],
            },
            adminNote: {
              type: "string",
              maxLength: 500,
            },
          },
        },

        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Something went wrong",
            },
          },
        },

        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
          },
        },

        Complaint: {
          type: "object",
          properties: {
            _id: {
              type: "string",
            },
            userId: {
              type: "string",
            },
            cafeId: {
              type: "string",
            },
            orderId: {
              type: "string",
            },
            category: {
              type: "string",
              enum: [
                "food_quality",
                "wrong_item",
                "late_order",
                "refund_issue",
                "payment_issue",
                "cafe_behavior",
                "technical_issue",
                "other",
              ],
            },
            subject: {
              type: "string",
            },
            description: {
              type: "string",
            },
            attachments: {
              type: "array",
              items: {
                type: "string",
              },
            },
            priority: {
              type: "string",
              enum: ["low", "medium", "high", "urgent"],
            },
            status: {
              type: "string",
              enum: ["open", "in_review", "resolved", "rejected", "closed"],
            },
            adminNote: {
              type: "string",
            },
            resolution: {
              type: "string",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },

        ComplaintAction: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["open", "in_review", "resolved", "rejected", "closed"],
            },
            adminNote: {
              type: "string",
            },
            resolution: {
              type: "string",
            },
            assignedTo: {
              type: "string",
            },
          },
        },
      },
    },

    security: [
      {
        cookieAuth: { type: "apiKey", in: "cookie", name: "accessToken" },
      },
    ],
  },

  apis: ["./src/modules/**/*.route.ts", "./src/modules/**/*.routes.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
