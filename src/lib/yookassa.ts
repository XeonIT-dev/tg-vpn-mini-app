import crypto from "crypto";

export interface YooKassaPaymentRequest {
  orderId: string;
  amountRub: number;
  description: string;
  returnUrl: string;
}

export interface YooKassaPaymentResponse {
  id: string;
  status: string;
  paid: boolean;
  confirmation_url?: string;
  amount: {
    value: string;
    currency: string;
  };
  metadata?: {
    order_id?: string;
  };
}

/**
 * Creates a payment link via YooKassa API for self-employed (Самозанятые) and businesses.
 * Supports Bank Cards (МИР, Visa, Mastercard), СБП (Система быстрых платежей), SberPay, T-Pay.
 */
export async function createYooKassaPayment({
  orderId,
  amountRub,
  description,
  returnUrl,
}: YooKassaPaymentRequest): Promise<{ paymentId: string; confirmationUrl: string }> {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  // Fallback demo mode if YooKassa credentials are not set yet
  if (!shopId || !secretKey) {
    console.warn("YOOKASSA_SHOP_ID or YOOKASSA_SECRET_KEY not set. Using test fallback simulation.");
    return {
      paymentId: `demo_payment_${crypto.randomUUID().slice(0, 8)}`,
      confirmationUrl: returnUrl,
    };
  }

  const idempotenceKey = crypto.randomUUID();
  const authHeader = `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;

  const payload = {
    amount: {
      value: amountRub.toFixed(2),
      currency: "RUB",
    },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: returnUrl,
    },
    description: description.slice(0, 128),
    metadata: {
      order_id: orderId,
    },
  };

  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
      Authorization: authHeader,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("YooKassa API Error:", data);
    throw new Error(data.description || "Ошибка создания платежа в ЮKassa");
  }

  const confirmationUrl = data.confirmation?.confirmation_url || returnUrl;

  return {
    paymentId: data.id,
    confirmationUrl,
  };
}

/**
 * Fetches status of an existing payment directly from YooKassa to prevent spoofing.
 */
export async function getYooKassaPayment(paymentId: string): Promise<YooKassaPaymentResponse | null> {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    return null;
  }

  const authHeader = `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;

  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: authHeader,
    },
  });

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as YooKassaPaymentResponse;
}
