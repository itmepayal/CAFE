import mongoose, { Document, Model, Schema } from "mongoose";

export type SettlementStatus = "pending" | "settled";

export interface ISettlement extends Document {
  orderId: mongoose.Types.ObjectId;
  cafeId: mongoose.Types.ObjectId;
  orderNumber: string;
  amount: number;
  status: SettlementStatus;
  settledAt: Date | null;
  settledBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const settlementSchema = new Schema<ISettlement>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
      index: true,
    },
    cafeId: {
      type: Schema.Types.ObjectId,
      ref: "Cafe",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "settled"],
      default: "pending",
      index: true,
    },
    settledAt: {
      type: Date,
      default: null,
    },
    settledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

settlementSchema.index({ cafeId: 1, createdAt: -1 });
settlementSchema.index({ cafeId: 1, status: 1 });

const Settlement: Model<ISettlement> =
  mongoose.models.Settlement ||
  mongoose.model<ISettlement>("Settlement", settlementSchema);

export default Settlement;
