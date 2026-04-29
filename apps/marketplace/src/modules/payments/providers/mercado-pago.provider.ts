import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { PaymentProvider, PaymentStatus } from "@prisma/client";

import type {
  CreateProviderCheckoutInput,
  ParsedProviderWebhook,
  PaymentProviderAdapter
} from "@/modules/payments/providers/payment-provider.interface";
import type { PaymentCheckoutSession } from "@/modules/payments/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

const toOptionalPaymentStatus = (value: unknown): PaymentStatus | undefined => {
  if (typeof value !== "string") return undefined;
  if (Object.values(PaymentStatus).includes(value as PaymentStatus)) {
    return value as PaymentStatus;
  }
  return undefined;
};

const toMetadata = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
};

// Map MercadoPago payment statuses to our internal enum.
// https://www.mercadopago.com.ar/developers/en/reference/payments/_payments_id/get
const MP_STATUS_MAP: Record<string, PaymentStatus> = {
  approved: PaymentStatus.APPROVED,
  authorized: PaymentStatus.PENDING,
  in_process: PaymentStatus.PENDING,
  in_mediation: PaymentStatus.PENDING,
  pending: PaymentStatus.PENDING,
  rejected: PaymentStatus.REJECTED,
  cancelled: PaymentStatus.CANCELLED,
  refunded: PaymentStatus.REFUNDED,
  charged_back: PaymentStatus.REFUNDED
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export class MercadoPagoProvider implements PaymentProviderAdapter {
  public readonly provider = PaymentProvider.MERCADOPAGO;

  // ── Checkout ──────────────────────────────────────────────────────────────

  public async createCheckout(input: CreateProviderCheckoutInput): Promise<PaymentCheckoutSession> {
    return {
      checkoutUrl: `https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=${input.paymentId}`,
      providerPaymentId: `mp_${randomUUID()}`,
      providerReference: `MP-${input.paymentId}`,
      metadata: {
        simulated: true,
        provider: this.provider,
        planCode: input.planCode
      }
    };
  }

  // ── Signature verification ────────────────────────────────────────────────
  //
  // MercadoPago sends a `x-signature` header in the format:
  //   ts=<unix_timestamp>,v1=<hmac_sha256_hex>
  //
  // The signed string is: "id:<notification_id>;request-id:<x-request-id>;ts:<ts>;"
  // where notification_id is `payload.id` (the webhook event id from MP).
  //
  // Reference: https://www.mercadopago.com.ar/developers/en/docs/your-integrations/notifications/webhooks

  public verifyWebhookRequest(headers: Record<string, string | null>, rawBody: string): boolean {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    if (!secret) {
      // Secret not configured → skip verification (dev / sandbox mode).
      return true;
    }

    const signature = headers["x-signature"];
    const requestId = headers["x-request-id"] ?? "";

    if (!signature) {
      return false;
    }

    let ts: string | undefined;
    let v1: string | undefined;

    for (const part of signature.split(",")) {
      const [key, value] = part.split("=");
      if (key === "ts") ts = value;
      if (key === "v1") v1 = value;
    }

    if (!ts || !v1) return false;

    let notificationId = "";
    try {
      const body = JSON.parse(rawBody) as Record<string, unknown>;
      notificationId = String(body.id ?? "");
    } catch {
      return false;
    }

    const signedString = `id:${notificationId};request-id:${requestId};ts:${ts};`;
    const expectedHash = createHmac("sha256", secret).update(signedString).digest("hex");

    // Constant-time comparison to avoid timing attacks.
    if (v1.length !== expectedHash.length) {
      return false;
    }

    return timingSafeEqual(Buffer.from(v1, "utf8"), Buffer.from(expectedHash, "utf8"));
  }

  // ── Webhook payload parsing ───────────────────────────────────────────────
  //
  // Real MP webhook body:
  // {
  //   "action": "payment.updated",
  //   "data": { "id": "12345678" },
  //   "id": "event-uuid",
  //   "type": "payment",
  //   ...
  // }
  //
  // When MERCADOPAGO_ACCESS_TOKEN is set, we call the Payments API to get live status.

  public async parseWebhookPayload(payload: Record<string, unknown>): Promise<ParsedProviderWebhook> {
    const action = toOptionalString(payload.action);
    const type = toOptionalString(payload.type);
    const mpEventId = toOptionalString(payload.id);
    const data = payload.data as Record<string, unknown> | undefined;
    const mpPaymentId = data ? toOptionalString(data.id) : undefined;

    if (type === "payment" && mpPaymentId) {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

      if (accessToken) {
        try {
          const res = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });

          if (res.ok) {
            const mpPayment = await res.json() as Record<string, unknown>;
            const mpStatus = toOptionalString(mpPayment.status);

            return {
              eventType: action ?? "payment.updated",
              externalEventId: mpEventId,
              providerPaymentId: mpPaymentId,
              providerReference: toOptionalString(mpPayment.external_reference),
              status: mpStatus ? (MP_STATUS_MAP[mpStatus] ?? PaymentStatus.PENDING) : undefined,
              paymentMethod: toOptionalString(mpPayment.payment_type_code),
              metadata: { mpPaymentId, mpStatus, action, source: "api" }
            };
          }
        } catch {
          // Fall through to payload-based parsing.
        }
      }

      // No access token or API unavailable: use any status hint in the payload.
      const rawStatus = toOptionalString(payload.status);
      return {
        eventType: action ?? "payment.updated",
        externalEventId: mpEventId,
        providerPaymentId: mpPaymentId,
        status: rawStatus ? (MP_STATUS_MAP[rawStatus] ?? toOptionalPaymentStatus(rawStatus)) : undefined,
        paymentMethod: toOptionalString(payload.paymentMethod),
        metadata: { mpPaymentId, action, source: "payload" }
      };
    }

    // Fallback: normalized format used when testing internally.
    const rawStatus = toOptionalString(payload.status);
    return {
      eventType: toOptionalString(payload.eventType) ?? action ?? "payment.updated",
      externalEventId: toOptionalString(payload.externalEventId) ?? mpEventId,
      paymentId: toOptionalString(payload.paymentId),
      providerPaymentId: toOptionalString(payload.providerPaymentId) ?? mpPaymentId,
      providerReference: toOptionalString(payload.providerReference),
      status: rawStatus ? (MP_STATUS_MAP[rawStatus] ?? toOptionalPaymentStatus(rawStatus)) : undefined,
      paymentMethod: toOptionalString(payload.paymentMethod),
      metadata: toMetadata(payload.metadata)
    };
  }
}

