import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminInvite extends Document {
  email?: string;
  tokenHash: string;
  createdBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  usedAt: Date | null;
  usedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const adminInviteSchema = new Schema<IAdminInvite>(
  {
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    usedAt: {
      type: Date,
      default: null,
    },

    usedBy: {
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

adminInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AdminInvite: Model<IAdminInvite> =
  mongoose.models.AdminInvite ||
  mongoose.model<IAdminInvite>("AdminInvite", adminInviteSchema);

export default AdminInvite;
