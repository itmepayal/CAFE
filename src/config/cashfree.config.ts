import crypto from "crypto";

export const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === "PRODUCTION"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

export const cashfreeHeaders = {
  "Content-Type": "application/json",
  "x-api-version": "2023-08-01",
  "x-client-id": process.env.CASHFREE_APP_ID!,
  "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
};

export const createCashfreeVendor = async (payload: {
  vendorId: string;
  name: string;
  email: string;
  phone: string;
  bankAccountNumber: string;
  ifsc: string;
}) => {
  const response = await fetch(`${CASHFREE_BASE_URL}/easy-split/vendors`, {
    method: "POST",
    headers: cashfreeHeaders,
    body: JSON.stringify({
      vendor_id: payload.vendorId,
      status: "ACTIVE",
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      verify_account: true,
      bank: {
        account_number: payload.bankAccountNumber,
        account_holder: payload.name,
        ifsc: payload.ifsc,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Vendor creation failed");
  }
  return data;
};

export const createCashfreeOrder = async (payload: {
  orderId: string;
  amount: number;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  vendorId: string;
  vendorAmount: number;
}) => {
  const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
    method: "POST",
    headers: cashfreeHeaders,
    body: JSON.stringify({
      order_id: payload.orderId,
      order_amount: payload.amount,
      order_currency: "INR",
      customer_details: {
        customer_id: payload.customerId,
        customer_phone: payload.customerPhone,
        customer_email: payload.customerEmail || "guest@example.com",
      },
      order_meta: {
        return_url: `${process.env.CLIENT_URL}/order/status?order_id={order_id}`,
        notify_url: `${process.env.SERVER_URL}/api/v1/orders/webhook/cashfree`,
      },
      order_splits: [
        {
          vendor_id: payload.vendorId,
          amount: payload.vendorAmount,
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Cashfree order creation failed");
  }
  return data;
};

export const verifyCashfreeOrder = async (cfOrderId: string) => {
  const response = await fetch(`${CASHFREE_BASE_URL}/orders/${cfOrderId}`, {
    method: "GET",
    headers: cashfreeHeaders,
  });
  return await response.json();
};

export const verifyCashfreeWebhookSignature = (
  rawBody: string,
  timestamp: string,
  signature: string,
): boolean => {
  const signedPayload = timestamp + rawBody;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.CASHFREE_SECRET_KEY!)
    .update(signedPayload)
    .digest("base64");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};
