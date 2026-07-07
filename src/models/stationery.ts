import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStationeryProduct extends Document {
  shopId: mongoose.Types.ObjectId;
  category: string;
  subCategory?: string;
  name: string;
  description: string;
  shortDescription: string;
  brand: string;
  sku: string;
  barcode?: string;
  images: string[];
  thumbnail: string;
  price: number;
  discountedPrice: number | null;
  costPrice: number;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  unit: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  variants: {
    name: string;
    value: string;
    price: number;
    stock: number;
  }[];
  specifications: {
    key: string;
    value: string;
  }[];
  tags: string[];
  isFeatured: boolean;
  isTrending: boolean;
  isPopular: boolean;
  isAvailable: boolean;
  isDeleted: boolean;
  totalSold: number;
  rating: {
    average: number;
    totalReviews: number;
  };
  readonly effectivePrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const stationeryProductSchema = new Schema<IStationeryProduct>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true,
    },

    subCategory: {
      type: String,
      default: "",
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    shortDescription: {
      type: String,
      default: "",
      maxlength: 200,
    },

    description: {
      type: String,
      default: "",
      maxlength: 2000,
    },

    brand: {
      type: String,
      default: "",
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    barcode: {
      type: String,
      default: "",
    },

    images: [
      {
        type: String,
      },
    ],

    thumbnail: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountedPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    costPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    maxOrderQuantity: {
      type: Number,
      default: 20,
      min: 1,
    },

    unit: {
      type: String,
      default: "piece",
    },

    weight: {
      type: Number,
      default: 0,
    },

    dimensions: {
      length: {
        type: Number,
        default: 0,
      },

      width: {
        type: Number,
        default: 0,
      },

      height: {
        type: Number,
        default: 0,
      },
    },

    variants: [
      {
        name: {
          type: String,
          required: true,
        },

        value: {
          type: String,
          required: true,
        },

        price: {
          type: Number,
          default: 0,
        },

        stock: {
          type: Number,
          default: 0,
        },
      },
    ],

    specifications: [
      {
        key: {
          type: String,
        },

        value: {
          type: String,
        },
      },
    ],

    tags: [
      {
        type: String,
      },
    ],

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isTrending: {
      type: Boolean,
      default: false,
    },

    isPopular: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    totalSold: {
      type: Number,
      default: 0,
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
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

stationeryProductSchema.index({
  name: "text",
  description: "text",
  brand: "text",
});

stationeryProductSchema.virtual("effectivePrice").get(function () {
  return this.discountedPrice ?? this.price;
});

const StationeryProduct: Model<IStationeryProduct> =
  mongoose.models.StationeryProduct ||
  mongoose.model<IStationeryProduct>(
    "StationeryProduct",
    stationeryProductSchema,
  );

export default StationeryProduct;
