import crypto from "crypto";
import { serverConfig } from ".";

console.log("========== CASHFREE CONFIG ==========");
console.log("Environment:", serverConfig.CASHFREE_ENV);
console.log(
  "Base URL:",
  serverConfig.CASHFREE_ENV === "PRODUCTION"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg",
);
console.log("App ID:", serverConfig.CASHFREE_APP_ID);
console.log(
  "Secret Key:",
  serverConfig.CASHFREE_SECRET_KEY ? "Loaded ✅" : "Missing ❌",
);
console.log("=====================================");

export const CASHFREE_BASE_URL =
  serverConfig.CASHFREE_ENV === "PRODUCTION"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

export const cashfreeHeaders = {
  "Content-Type": "application/json",
  "x-api-version": "2023-08-01",
  "x-client-id": serverConfig.CASHFREE_APP_ID!,
  "x-client-secret": serverConfig.CASHFREE_SECRET_KEY!,
};

export const createCashfreeOrder = async (payload: {
  orderId: string;
  amount: number;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
}) => {
  console.log("\n========== CREATE CASHFREE ORDER ==========");

  console.log("Request URL:");
  console.log(`${CASHFREE_BASE_URL}/orders`);

  console.log("\nHeaders:");
  console.log({
    "Content-Type": cashfreeHeaders["Content-Type"],
    "x-api-version": cashfreeHeaders["x-api-version"],
    "x-client-id": cashfreeHeaders["x-client-id"],
    "x-client-secret": cashfreeHeaders["x-client-secret"]
      ? "Loaded ✅"
      : "Missing ❌",
  });

  const requestBody = {
    order_id: payload.orderId,
    order_amount: payload.amount,
    order_currency: "INR",

    customer_details: {
      customer_id: payload.customerId,
      customer_phone: payload.customerPhone,
      customer_email: payload.customerEmail ?? "guest@example.com",
    },

    order_meta: {
      return_url: `${process.env.CLIENT_URL}/order/status?order_id={order_id}`,
      notify_url: `${process.env.SERVER_URL}/api/v1/orders/webhook/cashfree`,
    },
  };

  console.log("\nRequest Body:");
  console.log(JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: "POST",
      headers: cashfreeHeaders,
      body: JSON.stringify(requestBody),
    });

    console.log("\nHTTP Status:", response.status);
    console.log("Status Text:", response.statusText);

    const responseText = await response.text();

    console.log("\nRaw Response:");
    console.log(responseText);

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.log("Response is not valid JSON");
      throw new Error(responseText);
    }

    console.log("\nParsed Response:");
    console.log(data);

    if (!response.ok) {
      console.error("\nCashfree Error:");
      console.error(data);

      throw new Error(
        data.message ||
          data.error_description ||
          data.error ||
          "Cashfree order creation failed",
      );
    }

    console.log("\nCashfree Order Created Successfully ✅");
    return data;
  } catch (err) {
    console.error("\n========== CASHFREE EXCEPTION ==========");
    console.error(err);
    console.error("========================================");
    throw err;
  }
};

export const verifyCashfreeOrder = async (cfOrderId: string) => {
  console.log("\n========== VERIFY CASHFREE ORDER ==========");
  console.log("Cashfree Order ID:", cfOrderId);

  const response = await fetch(`${CASHFREE_BASE_URL}/orders/${cfOrderId}`, {
    method: "GET",
    headers: cashfreeHeaders,
  });

  console.log("Status:", response.status);

  const data = await response.json();

  console.log("Verify Response:");
  console.log(data);

  return data;
};

export const verifyCashfreeWebhookSignature = (
  rawBody: string,
  timestamp: string,
  signature: string,
): boolean => {
  const signedPayload = timestamp + rawBody;

  const expectedSignature = crypto
    .createHmac("sha256", serverConfig.CASHFREE_SECRET_KEY!)
    .update(signedPayload)
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature),
  );
};
