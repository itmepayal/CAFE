import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMenuItem extends Document {
  cafeId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;

  name: string;
  description: string;

  image: string;
  images: string[];

  price: number;
  discountedPrice: number | null;

  preparationTime: number;

  isVeg: boolean;
  isPopular: boolean;
  isRecommended: boolean;
  isAvailable: boolean;

  stockQuantity: number;

  tags: string[];

  nutritionalInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };

  displayOrder: number;
  totalOrders: number;

  rating: {
    average: number;
    totalReviews: number;
  };

  isDeleted: boolean;

  readonly effectivePrice: number;

  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    cafeId: {
      type: Schema.Types.ObjectId,
      ref: "Cafe",
      required: true,
      index: true,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "MenuCategory",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: "",
      maxlength: 500,
    },

    image: {
      type: String,
      default: "",
    },

    images: [
      {
        type: String,
      },
    ],

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

    preparationTime: {
      type: Number,
      default: 10,
      min: 1,
    },

    isVeg: {
      type: Boolean,
      default: true,
    },

    isPopular: {
      type: Boolean,
      default: false,
    },

    isRecommended: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    stockQuantity: {
      type: Number,
      default: -1,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    totalOrders: {
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

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

menuItemSchema.index({ name: "text", description: "text" });

menuItemSchema.virtual("effectivePrice").get(function (this: IMenuItem) {
  return this.discountedPrice ?? this.price;
});

const MenuItem: Model<IMenuItem> =
  mongoose.models.MenuItem ||
  mongoose.model<IMenuItem>("MenuItem", menuItemSchema);

export default MenuItem;
