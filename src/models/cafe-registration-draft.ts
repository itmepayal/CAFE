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
    searchLocation?: string;
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
    gstId?: string;
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
  };
  step4: {
    ownerPhoto?: string;
    layoutPhotos?: string[];
  };
  step5: {
    shopEstablishmentCertificate?: string;
    bankPassbookPhoto?: string;
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
    currentStep: { type: Number, default: 1, min: 1, max: 5 },
    step1: {
      cafeName: String,
      ownerName: String,
      description: String,
      mobile: String,
      email: String,
    },
    step2: {
      searchLocation: String,
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
      gstId: String,
      accountHolderName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
    },
    step4: {
      ownerPhoto: String,
      layoutPhotos: [String],
    },
    step5: {
      shopEstablishmentCertificate: String,
      bankPassbookPhoto: String,
    },
  },
  { timestamps: true, versionKey: false },
);

const CafeRegistrationDraft: Model<ICafeRegistrationDraft> =
  mongoose.models.CafeRegistrationDraft ||
  mongoose.model<ICafeRegistrationDraft>(
    "CafeRegistrationDraft",
    cafeRegistrationDraftSchema,
  );

export default CafeRegistrationDraft;
