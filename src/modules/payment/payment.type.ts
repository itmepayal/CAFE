export interface CreatePaymentOrderInput {
  orderId: string;
  userId: string;
  amount: number;
  customerPhone: string;
  customerEmail?: string;
  customerName?: string;
}

export interface CreatePaymentOrderResult {
  paymentSessionId: string;
  cashfreeOrderId: string;
  paymentId: string;
  orderId: string;
}

export interface CashfreeWebhookPayload {
  type: string;
  data: {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
    };
    payment: {
      cf_payment_id: string;
      payment_status: string;
      payment_amount: number;
      payment_method: Record<string, any>;
      payment_time: string;
      failure_reason?: string;
    };
  };
  event_time: string;
}

export interface VerifyPaymentStatusResult {
  status: string;
  cashfreePaymentId: string;
  isPaid: boolean;
}
