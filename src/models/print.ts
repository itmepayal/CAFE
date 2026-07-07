import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPrintOrder extends Document {
  userId: mongoose.Types.ObjectId;
  cafeId?: mongoose.Types.ObjectId | null;
  fileName: string;
  fileUrl: string;
  totalPages: number;
  copies: number;
  colorMode: "bw" | "color";
  paperSize: "A4" | "A3" | "Letter" | "Legal";
  paperGSM: 70 | 75 | 80 | 100 | 120 | 170 | 220 | 300;
  orientation: "portrait" | "landscape";
  pageRange: string;
  printQuality: "normal" | "high";
  printSide: "single" | "double";
  binding: "none" | "spiral" | "hard" | "soft" | "staple";
  lamination: boolean;
  coverPage: boolean;
  instructions: string;
  priceBreakdown: {
    printCost: number;
    bindingCost: number;
    laminationCost: number;
    deliveryCharge: number;
    tax: number;
    discount: number;
  };
  subtotal: number;
  total: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  status:
    | "uploaded"
    | "accepted"
    | "printing"
    | "binding"
    | "packed"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  estimatedCompletionTime?: Date;
  deliveredAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const printOrderSchema = new Schema<IPrintOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    cafeId: {
      type: Schema.Types.ObjectId,
      ref: "Cafe",
      default: null,
      index: true,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    totalPages: {
      type: Number,
      required: true,
      min: 1,
    },

    copies: {
      type: Number,
      default: 1,
      min: 1,
    },

    colorMode: {
      type: String,
      enum: ["bw", "color"],
      default: "bw",
    },

    paperSize: {
      type: String,
      enum: ["A4", "A3", "Letter", "Legal"],
      default: "A4",
    },

    paperGSM: {
      type: Number,
      enum: [70, 75, 80, 100, 120, 170, 220, 300],
      default: 75,
    },

    orientation: {
      type: String,
      enum: ["portrait", "landscape"],
      default: "portrait",
    },

    pageRange: {
      type: String,
      default: "all",
    },

    printQuality: {
      type: String,
      enum: ["normal", "high"],
      default: "normal",
    },

    printSide: {
      type: String,
      enum: ["single", "double"],
      default: "single",
    },

    binding: {
      type: String,
      enum: ["none", "spiral", "hard", "soft", "staple"],
      default: "none",
    },

    lamination: {
      type: Boolean,
      default: false,
    },

    coverPage: {
      type: Boolean,
      default: false,
    },

    instructions: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    priceBreakdown: {
      printCost: {
        type: Number,
        default: 0,
      },

      bindingCost: {
        type: Number,
        default: 0,
      },

      laminationCost: {
        type: Number,
        default: 0,
      },

      deliveryCharge: {
        type: Number,
        default: 0,
      },

      tax: {
        type: Number,
        default: 0,
      },

      discount: {
        type: Number,
        default: 0,
      },
    },

    subtotal: {
      type: Number,
      default: 0,
    },

    total: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    status: {
      type: String,
      enum: [
        "uploaded",
        "accepted",
        "printing",
        "binding",
        "packed",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "uploaded",
      index: true,
    },

    estimatedCompletionTime: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

printOrderSchema.index({
  userId: 1,
  createdAt: -1,
});

printOrderSchema.index({
  status: 1,
  paymentStatus: 1,
});

const PrintOrder: Model<IPrintOrder> =
  mongoose.models.PrintOrder ||
  mongoose.model<IPrintOrder>("PrintOrder", printOrderSchema);

export default PrintOrder;
