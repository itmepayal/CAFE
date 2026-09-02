import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICafe extends Document {
  userId: mongoose.Types.ObjectId;

  cafeName: string;
  ownerName: string;
  description: string;

  mobile: string;
  email: string;

  address: {
    street?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };

  location: {
    latitude?: number;
    longitude?: number;
  };

  cafeImage: string;
  menuImage: string;
  gallery: string[];
  layoutPhotos: string[];

  documents: {
    aadharNumber: string;
    aadharPhoto: string;
    panNumber: string;
    panPhoto: string;
    fssaiNumber: string;
    fssaiCertificate: string;
  };

  bankDetails: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    upiId: string;
    gstId: string;
    bankPassbookPhoto: string;
  };

  socialMedia: {
    instagram: string;
    facebook: string;
    website: string;
  };

  registrationFeedback: string;

  isOpen: boolean;
  isBlocked: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  supportsDelivery: boolean;

  status: "pending" | "approved" | "rejected";

  adminNote: string;

  approvedBy?: mongoose.Types.ObjectId | null;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;

  rating: {
    average: number;
    totalReviews: number;
  };

  stats: {
    totalOrders: number;
    totalRevenue: number;
  };

  isApproved: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const cafeSchema = new Schema<ICafe>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    cafeName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    address: {
      street: String,
      area: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
    },

    location: {
      latitude: Number,
      longitude: Number,
    },

    cafeImage: {
      type: String,
      default: "",
    },

    menuImage: {
      type: String,
      default: "",
    },

    gallery: [
      {
        type: String,
      },
    ],

    layoutPhotos: [
      {
        type: String,
      },
    ],

    documents: {
      aadharNumber: {
        type: String,
        required: true,
        trim: true,
      },

      aadharPhoto: {
        type: String,
        default: "",
      },

      panNumber: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },

      panPhoto: {
        type: String,
        default: "",
      },

      fssaiNumber: {
        type: String,
        required: true,
        trim: true,
      },

      fssaiCertificate: {
        type: String,
        default: "",
      },
    },

    bankDetails: {
      accountHolderName: {
        type: String,
        required: true,
      },

      accountNumber: {
        type: String,
        required: true,
      },

      bankName: {
        type: String,
        default: "",
        trim: true,
      },

      ifscCode: {
        type: String,
        required: true,
        uppercase: true,
      },

      upiId: {
        type: String,
        required: true,
        lowercase: true,
      },

      gstId: {
        type: String,
        default: "",
        trim: true,
      },

      bankPassbookPhoto: {
        type: String,
        default: "",
      },
    },

    socialMedia: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      website: { type: String, default: "" },
    },

    registrationFeedback: {
      type: String,
      default: "",
      maxlength: 1000,
    },

    isOpen: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isVisible: {
      type: Boolean,
      default: false,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    supportsDelivery: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    adminNote: {
      type: String,
      default: "",
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },

      totalReviews: {
        type: Number,
        default: 0,
      },
    },

    stats: {
      totalOrders: {
        type: Number,
        default: 0,
      },

      totalRevenue: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

cafeSchema.index({ isOpen: 1 });
cafeSchema.index({ "address.city": 1 });
cafeSchema.index({ createdAt: -1 });

cafeSchema.virtual("isApproved").get(function (this: ICafe) {
  return this.status === "approved";
});

const Cafe: Model<ICafe> =
  mongoose.models.Cafe || mongoose.model<ICafe>("Cafe", cafeSchema);

export default Cafe;
