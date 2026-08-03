import mongoose, { Document, Model, Schema } from "mongoose";

export type PaymentProvider = "cashfree";

export type PaymentMethod =
  | "upi"
  | "card"
  | "netbanking"
  | "wallet"
  | "emi"
  | "cash";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  amount: number;
  currency: string;

  provider: PaymentProvider;

  cashfreeOrderId: string;
  cashfreePaymentId: string;
  paymentSessionId: string;

  paymentMethod: PaymentMethod;
  status: PaymentStatus;

  refundAmount: number;
  refundReason: string;
  refundedAt: Date | null;
  cashfreeRefundId: string;

  failureCode: string;
  failureReason: string;

  isWebhookVerified: boolean;
  webhookEventId: string;
  lastWebhookAt: Date | null;
  webhookAttempts: number;

  paidAt: Date | null;
  expiresAt: Date | null;

  gatewayResponse: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    provider: {
      type: String,
      enum: ["cashfree"],
      default: "cashfree",
      index: true,
    },

    cashfreeOrderId: {
      type: String,
      default: "",
      unique: true,
      sparse: true,
      index: true,
    },

    cashfreePaymentId: {
      type: String,
      default: "",
      index: true,
    },

    paymentSessionId: {
      type: String,
      default: "",
    },

    paymentMethod: {
      type: String,
      enum: ["upi", "card", "netbanking", "wallet", "emi", "cash"],
      default: "upi",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "success",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      default: "pending",
      index: true,
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    refundReason: {
      type: String,
      default: "",
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    cashfreeRefundId: {
      type: String,
      default: "",
      index: true,
    },

    failureCode: {
      type: String,
      default: "",
    },

    failureReason: {
      type: String,
      default: "",
    },

    isWebhookVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    webhookEventId: {
      type: String,
      default: "",
      index: true,
    },

    lastWebhookAt: {
      type: Date,
      default: null,
    },

    webhookAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    gatewayResponse: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// =========================
// INDEXES
// =========================
paymentSchema.index({ orderId: 1, status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ provider: 1 });
paymentSchema.index({ webhookEventId: 1 }, { sparse: true });

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
