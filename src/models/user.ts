import mongoose, { Schema, Document, Model } from "mongoose";

interface IDeviceToken {
  token: string;
  platform: "android" | "ios" | "web";
}

export interface IUser extends Document {
  name: string;
  email: string;
  profileImage: string;
  phone: string | null;

  provider: "google" | "apple";
  providerId: string;

  role: "student" | "cafe_owner" | "admin" | "super_admin";

  isEmailVerified: boolean;
  isBlocked: boolean;
  isActive: boolean;

  ownedCafe: mongoose.Types.ObjectId | null;

  favoriteCafes: mongoose.Types.ObjectId[];

  university: string;

  lastLoginAt: Date | null;
  loginCount: number;

  deviceTokens: IDeviceToken[];

  adminNote: string;

  readonly isCafeOwner: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: null,
    },

    provider: {
      type: String,
      enum: ["google", "apple"],
      required: true,
    },

    providerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["student", "cafe_owner", "admin", "super_admin"],
      default: "student",
      index: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    ownedCafe: {
      type: Schema.Types.ObjectId,
      ref: "Cafe",
      default: null,
    },

    favoriteCafes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Cafe",
      },
    ],

    university: {
      type: String,
      trim: true,
      default: "",
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    loginCount: {
      type: Number,
      default: 0,
    },

    deviceTokens: [
      {
        token: {
          type: String,
        },

        platform: {
          type: String,
          enum: ["android", "ios", "web"],
        },
      },
    ],

    adminNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ providerId: 1 });
userSchema.index({ createdAt: -1 });

userSchema.virtual("isCafeOwner").get(function (this: IUser) {
  return this.role === "cafe_owner";
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
