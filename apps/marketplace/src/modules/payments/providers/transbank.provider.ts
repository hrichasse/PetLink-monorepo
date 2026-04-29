import { randomUUID } from "crypto";
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

// Map Transbank transaction statuses to our internal enum.
// https://www.transbankdevelopers.cl/referencia/webpay
const TBK_STATUS_MAP: Record<string, PaymentStatus> = {
  AUTHORIZED: PaymentStatus.APPROVED,
  CAPTURED: PaymentStatus.APPROVED,
  FAILED: PaymentStatus.REJECTED,
  NULLIFIED: PaymentStatus.CANCELLED,
  PARTIALLY_NULLIFIED: PaymentStatus.REFUNDED,
  REVERSED: PaymentStatus.REFUNDED,
  INITIALIZED: PaymentStatus.PENDING
};

// Public Transbank integration-environment credentials.
// These are provided by Transbank in their documentation for testing.
const TBK_DEFAULT_COMMERCE_CODE = "597055555532";
const TBK_DEFAULT_API_KEY =
  "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C";

// ─── Provider ─────────────────────────────────────────────────────────────────

export class TransbankProvider implements PaymentProviderAdapter {
  public readonly provider = PaymentProvider.TRANSBANK;

  // ── Checkout ──────────────────────────────────────────────────────────────

  public async createCheckout(input: CreateProviderCheckoutInput): Promise<PaymentCheckoutSession> {
    return {
      checkoutUrl: `https://webpay3gint.transbank.cl/webpayserver/initTransaction?buyOrder=${input.paymentId}`,
      providerPaymentId: `tbk_${randomUUID()}`,
      providerReference: `TBK-${input.paymentId}`,
      metadata: {
        simulated: true,
        provider: this.provider,
        planCode: input.planCode
      }
    };
  }

  // ── Webhook payload parsing ───────────────────────────────────────────────
  //
  // Transbank Webpay Plus does not use async push webhooks.
  // After checkout, the user is redirected to our return_url with:
  //   - token_ws=<token>  → payment completed (must confirm via PUT)
  //   - TBK_TOKEN=<token> → user cancelled before paying
  //
  // We treat our webhook endpoint as this return_url callback.
  // When TRANSBANK_COMMERCE_CODE / TRANSBANK_API_KEY are set (production),
  // we call the Transbank API to confirm and get the authoritative status.

  public async parseWebhookPayload(payload: Record<string, unknown>): Promise<ParsedProviderWebhook> {
    const tokenWs = toOptionalString(payload.token_ws);
    const tbkToken = toOptionalString(payload.TBK_TOKEN);
    const buyOrder = toOptionalString(payload.TBK_ORDEN_COMPRA);

    // ── User cancelled before paying (Transbank sends TBK_TOKEN, no token_ws) ──
    if (tbkToken && !tokenWs) {
      return {
        eventType: "transaction.cancelled",
        externalEventId: tbkToken,
        providerPaymentId: tbkToken,
        providerReference: buyOrder,
        status: PaymentStatus.CANCELLED,
        paymentMethod: "webpay",
        metadata: { tbkToken, buyOrder, reason: "user_cancelled" }
      };
    }

    // ── Payment completed: confirm with Transbank API ──────────────────────
    if (tokenWs) {
      const isProduction = process.env.TRANSBANK_ENV === "production";
      const baseUrl = isProduction
        ? "https://webpay3g.transbank.cl"
        : "https://webpay3gint.transbank.cl";
      const commerceCode =
        process.env.TRANSBANK_COMMERCE_CODE ?? TBK_DEFAULT_COMMERCE_CODE;
      const apiKey = process.env.TRANSBANK_API_KEY ?? TBK_DEFAULT_API_KEY;

      try {
        const res = await fetch(
          `${baseUrl}/rswebpaytransaction/api/webpay/v1.2/transactions/${tokenWs}`,
          {
            method: "PUT",
            headers: {
              "Tbk-Api-Key-Id": commerceCode,
              "Tbk-Api-Key-Secret": apiKey,
              "Content-Type": "application/json"
            }
          }
        );

        if (res.ok) {
          const tbkResponse = await res.json() as Record<string, unknown>;
          const tbkStatus = toOptionalString(tbkResponse.status);
          // Transbank response_code === 0 means approved.
          const responseCode = tbkResponse.response_code;
          const isApproved = responseCode === 0 || responseCode === "0";

          return {
            eventType: "transaction.updated",
            externalEventId: tokenWs,
            providerPaymentId: tokenWs,
            providerReference: toOptionalString(tbkResponse.buy_order) ?? buyOrder,
            status: isApproved
              ? PaymentStatus.APPROVED
              : (tbkStatus
                  ? (TBK_STATUS_MAP[tbkStatus] ?? PaymentStatus.REJECTED)
                  : PaymentStatus.REJECTED),
            paymentMethod: "webpay",
            metadata: { tokenWs, tbkStatus, responseCode, source: "api" }
          };
        }
      } catch {
        // Fall through: API unreachable, mark as pending for manual review.
      }

      // Could not confirm with Transbank — set PENDING for manual review.
      return {
        eventType: "transaction.updated",
        externalEventId: tokenWs,
        providerPaymentId: tokenWs,
        providerReference: buyOrder,
        status: PaymentStatus.PENDING,
        paymentMethod: "webpay",
        metadata: { tokenWs, source: "payload", note: "api_confirmation_failed" }
      };
    }

    // ── Fallback: normalized format (for internal testing) ─────────────────
    const rawStatus = toOptionalString(payload.status);
    return {
      eventType: toOptionalString(payload.eventType) ?? "transaction.updated",
      externalEventId: toOptionalString(payload.externalEventId),
      paymentId: toOptionalString(payload.paymentId),
      providerPaymentId: toOptionalString(payload.providerPaymentId),
      providerReference: toOptionalString(payload.providerReference),
      status: rawStatus ? (TBK_STATUS_MAP[rawStatus] ?? toOptionalPaymentStatus(rawStatus)) : undefined,
      paymentMethod: toOptionalString(payload.paymentMethod),
      metadata: toMetadata(payload.metadata)
    };
  }
}

