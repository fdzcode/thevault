import { createHmac } from "crypto";
import { env } from "~/env";

const BASE_URL = "https://api.nowpayments.io/v1";

function getApiKey(): string {
  const key = env.NOWPAYMENTS_API_KEY;
  if (!key) {
    throw new Error("NOWPAYMENTS_API_KEY is not set");
  }
  return key;
}

interface CreateInvoiceParams {
  priceAmount: number; // in dollars (not cents)
  orderId: string;
  orderDescription: string;
  ipnCallbackUrl: string;
  successUrl: string;
  cancelUrl: string;
}

interface InvoiceResponse {
  id: string;
  invoice_url: string;
}

export async function createInvoice(
  params: CreateInvoiceParams,
): Promise<InvoiceResponse> {
  const res = await fetch(`${BASE_URL}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: params.priceAmount,
      price_currency: "usd",
      order_id: params.orderId,
      order_description: params.orderDescription,
      ipn_callback_url: params.ipnCallbackUrl,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NOWPayments createInvoice failed (${res.status}): ${text}`);
  }

  return (await res.json()) as InvoiceResponse;
}

interface PaymentStatus {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  actually_paid: number;
  outcome_amount: number;
  outcome_currency: string;
}

export async function getPaymentStatus(
  paymentId: string,
): Promise<PaymentStatus> {
  const res = await fetch(`${BASE_URL}/payment/${paymentId}`, {
    headers: {
      "x-api-key": getApiKey(),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `NOWPayments getPaymentStatus failed (${res.status}): ${text}`,
    );
  }

  return (await res.json()) as PaymentStatus;
}

export function verifyIpnSignature(
  body: Record<string, unknown>,
  signature: string,
): boolean {
  const secret = env.NOWPAYMENTS_IPN_SECRET;
  if (!secret) {
    throw new Error("NOWPAYMENTS_IPN_SECRET is not set");
  }

  // NOWPayments IPN: sort keys, JSON.stringify, then HMAC-SHA512
  const sorted = Object.keys(body)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = body[key];
      return acc;
    }, {});

  const hmac = createHmac("sha512", secret);
  hmac.update(JSON.stringify(sorted));
  const computed = hmac.digest("hex");

  return computed === signature;
}
