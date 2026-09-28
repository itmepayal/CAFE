import mongoose, { Document, Model, Schema } from "mongoose";

/**
 * Tracks processed Cashfree webhook event keys for idempotency
 * across all event types (success, failed, dropped, refund).
 */
export interface IWebhookEvent extends Document {
  eventKey: string;
  eventType: string;
  orderNumber: string;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      index: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const WebhookEvent: Model<IWebhookEvent> =
  mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>("WebhookEvent", webhookEventSchema);

export default WebhookEvent;
