import fs from "fs";
import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import { serverConfig } from "../config";
import { adminSwaggerSchemas } from "./admin.swagger.schemas";
import { ownerSwaggerSchemas } from "./owner.swagger.schemas";
import { studentSwaggerSchemas } from "./student.swagger.schemas";

/**
 * Prefer TypeScript sources when present (dev / Render native / Docker with src).
 * Docs-only files (owner/student/socket.docs) lose most @swagger JSDoc on `tsc`
 * emit, so scanning compiled JS alone yields an incomplete OpenAPI document.
 * Fall back to dist route files when src is absent.
 */
const srcModulesDir = path.join(process.cwd(), "src", "modules");
const useSrcDocs = fs.existsSync(srcModulesDir);

const swaggerApiGlobs = useSrcDocs
  ? [
      "./src/modules/**/*.route.ts",
      "./src/modules/**/*.routes.ts",
      "./src/socket/socket.docs.ts",
      "./src/config/owner.swagger.docs.ts",
      "./src/config/student.swagger.docs.ts",
    ]
  : [
      "./dist/modules/**/*.route.js",
      "./dist/modules/**/*.routes.js",
      "./dist/socket/socket.docs.js",
      "./dist/config/owner.swagger.docs.js",
      "./dist/config/student.swagger.docs.js",
    ];

/** OpenAPI "Try it out" base — paths are like /auth/google under /api/v1. */
const openApiServerUrl = serverConfig.API_BASE_URL.replace(/\/$/, "");

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Gravly Backend API",
      version: "1.0.0",
      description:
        "Gravly (Cafe Mart) Backend API — Student, Cafe Owner, and Super Admin flows.",
    },

    servers: [
      {
        url: openApiServerUrl,
        description:
          serverConfig.NODE_ENV === "production"
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
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Use accessToken from login response",
        },
      },

      schemas: {
        ...adminSwaggerSchemas,
        ...ownerSwaggerSchemas,
        ...studentSwaggerSchemas,

        Cafe: {
          type: "object",
          properties: {
            _id: { type: "string" },
            cafeName: { type: "string", example: "Moonlight Cafe" },
            ownerName: { type: "string", example: "Vishu Kumar" },
            description: { type: "string" },
            mobile: { type: "string", example: "9876543210" },
            email: { type: "string", format: "email" },
            address: {
              type: "object",
              properties: {
                street: { type: "string" },
                area: { type: "string", example: "VIT-1" },
                city: { type: "string" },
                state: { type: "string" },
                pincode: { type: "string" },
                landmark: { type: "string" },
              },
            },
            cafeImage: { type: "string" },
            menuImage: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "approved", "rejected"],
            },
            isOpen: {
              type: "boolean",
              description: "Figma STATUS toggle (OPEN/CLOSED)",
            },
            isVisible: {
              type: "boolean",
              description: "Figma VISIBLE toggle (show/hide in student app)",
            },
            isBlocked: {
              type: "boolean",
              description: "Admin block — forces hidden + restricted",
            },
            statusLabel: {
              type: "string",
              enum: ["OPEN", "CLOSED"],
            },
            rating: {
              type: "object",
              properties: {
                average: { type: "number" },
                totalReviews: { type: "integer" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
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

    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },

  apis: swaggerApiGlobs,
};

export const swaggerSpec = swaggerJsdoc(options);
