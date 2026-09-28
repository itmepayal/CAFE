import mongoose, { Document, Model, Schema } from "mongoose";

export type AuditAction =
  | "user.block"
  | "user.unblock"
  | "cafe.approve"
  | "cafe.reject"
  | "cafe.block"
  | "cafe.unblock"
  | "cafe.toggle_open"
  | "cafe.toggle_visibility"
  | "order.force_cancel"
  | "order.refund"
  | "settlement.settle"
  | "admin.invite_create"
  | "order.auto_cancel_trigger";

export interface IAuditLog extends Document {
  actorId: mongoose.Types.ObjectId;
  actorRole: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  requestId?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    requestId: {
      type: String,
      default: undefined,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export default AuditLog;
