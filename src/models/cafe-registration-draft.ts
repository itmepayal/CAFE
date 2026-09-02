import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICafeRegistrationDraft extends Document {
  userId: mongoose.Types.ObjectId;
  currentStep: number;
  step1: {
    cafeName?: string;
    ownerName?: string;
    description?: string;
    mobile?: string;
    email?: string;
  };
  step2: {
    street?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
    latitude?: number;
    longitude?: number;
  };
  step3: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    bankName?: string;
    gstId?: string;
  };
  step4: {
    cafeImage?: string;
    menuImage?: string;
    gallery?: string[];
    layoutPhotos?: string[];
    aadharNumber?: string;
    panNumber?: string;
    fssaiNumber?: string;
    aadharPhoto?: string;
    panPhoto?: string;
    fssaiCertificate?: string;
    bankPassbookPhoto?: string;
  };
  step5: {
    registrationFeedback?: string;
    socialMedia?: {
      instagram?: string;
      facebook?: string;
      website?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const cafeRegistrationDraftSchema = new Schema<ICafeRegistrationDraft>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    step1: {
      cafeName: String,
      ownerName: String,
      description: String,
      mobile: String,
      email: String,
    },
    step2: {
      street: String,
      area: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
      latitude: Number,
      longitude: Number,
    },
    step3: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      upiId: String,
      bankName: String,
      gstId: String,
    },
    step4: {
      cafeImage: String,
      menuImage: String,
      gallery: [String],
      layoutPhotos: [String],
      aadharNumber: String,
      panNumber: String,
      fssaiNumber: String,
      aadharPhoto: String,
      panPhoto: String,
      fssaiCertificate: String,
      bankPassbookPhoto: String,
    },
    step5: {
      registrationFeedback: String,
      socialMedia: {
        instagram: String,
        facebook: String,
        website: String,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const CafeRegistrationDraft: Model<ICafeRegistrationDraft> =
  mongoose.models.CafeRegistrationDraft ||
  mongoose.model<ICafeRegistrationDraft>(
    "CafeRegistrationDraft",
    cafeRegistrationDraftSchema,
  );

export default CafeRegistrationDraft;
