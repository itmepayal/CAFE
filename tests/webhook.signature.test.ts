import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { verifyCashfreeWebhookSignature } from "../src/config/cashfree.config";

describe("verifyCashfreeWebhookSignature", () => {
  it("returns true for a valid signature", () => {
    const rawBody = JSON.stringify({
      type: "PAYMENT_SUCCESS_WEBHOOK",
      data: { order: { order_id: "GV12345678" } },
    });
    const timestamp = "1710000000";

    const signature = crypto
      .createHmac("sha256", "test-cashfree-secret")
      .update(timestamp + rawBody)
      .digest("base64");

    expect(
      verifyCashfreeWebhookSignature(rawBody, timestamp, signature),
    ).toBe(true);
  });

  it("returns false for an invalid signature", () => {
    expect(
      verifyCashfreeWebhookSignature("{}", "1710000000", "invalid-signature"),
    ).toBe(false);
  });
});
