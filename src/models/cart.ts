import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICartItem {
  menuItemId: mongoose.Types.ObjectId;

  itemName: string;
  itemImage: string;

  price: number;
  quantity: number;

  subtotal: number;

  specialInstructions?: string;
}

export interface ICart extends Document {
  userId: string;

  cafeId: string;

  items: ICartItem[];

  totalItems: number;
  subtotal: number;

  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },

    itemName: {
      type: String,
      required: true,
    },

    itemImage: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    subtotal: {
      type: Number,
      required: true,
    },

    specialInstructions: {
      type: String,
      default: "",
    },
  },
  {
    _id: true,
  },
);

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    cafeId: {
      type: String,
      ref: "Cafe",
      required: true,
    },

    items: [cartItemSchema],

    totalItems: {
      type: Number,
      default: 0,
    },

    subtotal: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>("Cart", cartSchema);

export default Cart;
