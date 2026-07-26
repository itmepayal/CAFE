import mongoose, { Schema, Document, Model } from "mongoose";
import {
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  ORDER_STATUSES,
  ORDER_TYPES,
  DELIVERY_STATUSES,
  CANCELLED_BY,
  PaymentStatus,
  PaymentMethod,
  OrderStatus,
  OrderType,
  DeliveryStatus,
  CancelledBy,
} from "../modules/order/order.constant";

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  itemName: string;
  itemImage: string;
  itemPrice: number;
  quantity: number;
  subtotal: number;
  specialInstructions: string;
}

export interface IDeliveryAddress {
  hostelName?: string;
  roomNumber?: string;
  landmark?: string;
  contactNumber: string;
  fullAddress: string;
}

export interface IOrder extends Document {
  studentId: mongoose.Types.ObjectId;
  cafeId: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentId: string;
  status: OrderStatus;
  orderType: OrderType;
  isOpen: boolean;
  supportsDelivery: boolean;
  pickupCode: string;
  deliveryAddress?: IDeliveryAddress;
  deliveryPersonId?: mongoose.Types.ObjectId | null;
  deliveryStatus?: DeliveryStatus | null;
  cancelledBy: CancelledBy | null;
  estimatedReadyTime: Date | null;
  notes: string;
  cancellationReason: string;
  rating?: {
    stars?: number;
    review?: string;
    reviewedAt?: Date;
  };
  statusHistory: {
    status: string;
    changedAt: Date;
  }[];
  acceptedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  outForDeliveryAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    menuItemId: {
      type: Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    itemImage: {
      type: String,
      default: "",
    },

    itemPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    specialInstructions: {
      type: String,
      default: "",
      maxlength: 200,
    },
  },
  {
    _id: false,
  },
);

const deliveryAddressSchema = new Schema<IDeliveryAddress>(
  {
    hostelName: {
      type: String,
      default: "",
    },

    roomNumber: {
      type: String,
      default: "",
    },

    landmark: {
      type: String,
      default: "",
    },

    contactNumber: {
      type: String,
      required: true,
    },

    fullAddress: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const orderSchema = new Schema<IOrder>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    cafeId: {
      type: Schema.Types.ObjectId,
      ref: "Cafe",
      required: true,
      index: true,
    },

    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (value: IOrderItem[]) => value.length > 0,
        "Order must contain items",
      ],
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "upi",
    },

    paymentId: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },

    orderType: {
      type: String,
      enum: ORDER_TYPES,
      required: true,
      default: "pickup",
      index: true,
    },

    pickupCode: {
      type: String,
      index: true,
    },

    deliveryAddress: {
      type: deliveryAddressSchema,
      default: undefined,
    },

    deliveryPersonId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deliveryStatus: {
      type: String,
      enum: DELIVERY_STATUSES,
      default: null,
    },

    estimatedReadyTime: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      default: "",
      maxlength: 500,
    },

    cancelledBy: {
      type: String,
      enum: CANCELLED_BY,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
    },

    rating: {
      stars: {
        type: Number,
        min: 1,
        max: 5,
      },

      review: {
        type: String,
        default: "",
      },

      reviewedAt: Date,
    },

    statusHistory: [
      {
        status: String,

        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    acceptedAt: Date,
    preparingAt: Date,
    readyAt: Date,
    outForDeliveryAt: Date,
    completedAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

orderSchema.index({ studentId: 1, createdAt: -1 });
orderSchema.index({ cafeId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderType: 1 });

orderSchema.pre("save", function (next) {
  const order = this as IOrder;

  if (!order.orderNumber) {
    order.orderNumber =
      "GV" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000);
  }

  if (order.orderType === "pickup" && !order.pickupCode) {
    order.pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
  }

  if (order.orderType === "delivery") {
    if (!order.deliveryAddress) {
      return;
    }

    if (!order.deliveryStatus) {
      order.deliveryStatus = "not_assigned";
    }
  }
});

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
