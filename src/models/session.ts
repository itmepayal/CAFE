import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  sessionId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    familyId: {
      type: String,
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", sessionSchema);

export default Session;
