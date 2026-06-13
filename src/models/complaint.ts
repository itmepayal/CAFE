import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComplaint extends Document {
  userId: mongoose.Types.ObjectId;
  cafeId?: mongoose.Types.ObjectId | null;
  orderId?: mongoose.Types.ObjectId | null;
  category:
    | "food_quality"
    | "wrong_item"
    | "late_order"
    | "refund_issue"
    | "payment_issue"
    | "cafe_behavior"
    | "technical_issue"
    | "other";

  subject: string;
  description: string;
  attachments: string[];
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_review" | "resolved" | "rejected" | "closed";

  assignedTo?: mongoose.Types.ObjectId | null;
  adminNote: string;
  resolution: string;

  userSatisfied?: boolean | null;

  resolvedAt?: Date | null;
  closedAt?: Date | null;

  readonly isResolved: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const complaintSchema = new Schema<IComplaint>(
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

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },

    category: {
      type: String,
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
      default: "other",
      index: true,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    attachments: [
      {
        type: String,
      },
    ],

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },

    status: {
      type: String,
      enum: ["open", "in_review", "resolved", "rejected", "closed"],
      default: "open",
      index: true,
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminNote: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    resolution: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    userSatisfied: {
      type: Boolean,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

complaintSchema.index({ userId: 1, createdAt: -1 });
complaintSchema.index({ cafeId: 1 });
complaintSchema.index({ orderId: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ priority: 1 });

complaintSchema.virtual("isResolved").get(function (this: IComplaint) {
  return ["resolved", "closed"].includes(this.status);
});

const Complaint: Model<IComplaint> =
  mongoose.models.Complaint ||
  mongoose.model<IComplaint>("Complaint", complaintSchema);

export default Complaint;
