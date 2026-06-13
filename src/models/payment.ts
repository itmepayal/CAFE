import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  amount: number;
  currency: string;

  provider: "upi" | "razorpay" | "stripe";

  gatewayOrderId: string;
  transactionId: string;
  paymentSignature: string;

  paymentMethod: "upi" | "card" | "netbanking" | "wallet" | "cash";

  status:
    | "pending"
    | "processing"
    | "success"
    | "failed"
    | "cancelled"
    | "refunded"
    | "partially_refunded";

  refundAmount: number;
  refundReason: string;
  refundedAt: Date | null;

  failureCode: string;
  failureReason: string;

  isVerified: boolean;
  verifiedAt: Date | null;

  gatewayResponse: Record<string, any>;

  paidAt: Date | null;

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
    },

    provider: {
      type: String,
      enum: ["upi", "razorpay", "stripe"],
      default: "razorpay",
      index: true,
    },

    gatewayOrderId: {
      type: String,
      default: "",
      index: true,
    },

    transactionId: {
      type: String,
      default: "",
      index: true,
    },

    paymentSignature: {
      type: String,
      default: "",
    },

    paymentMethod: {
      type: String,
      enum: ["upi", "card", "netbanking", "wallet", "cash"],
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

    failureCode: {
      type: String,
      default: "",
    },

    failureReason: {
      type: String,
      default: "",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    gatewayResponse: {
      type: Schema.Types.Mixed,
      default: {},
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ provider: 1 });

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
