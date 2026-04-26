import { randomUUID } from "crypto";
import { PaymentProvider, PaymentStatus } from "@prisma/client";

import type { CreateProviderCheckoutInput, ParsedProviderWebhook, PaymentProviderAdapter } from "@/modules/payments/providers/payment-provider.interface";
import type { PaymentCheckoutSession } from "@/modules/payments/types";

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? undefined : trimmedValue;
};

const toOptionalPaymentStatus = (value: unknown): PaymentStatus | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  if (Object.values(PaymentStatus).includes(value as PaymentStatus)) {
    return value as PaymentStatus;
  }

  return undefined;
};

const toMetadata = (value: unknown): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
};

export class TransbankProvider implements PaymentProviderAdapter {
  public readonly provider = PaymentProvider.TRANSBANK;

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

  public async parseWebhookPayload(payload: Record<string, unknown>): Promise<ParsedProviderWebhook> {
    return {
      eventType: toOptionalString(payload.eventType) ?? "transaction.updated",
      externalEventId: toOptionalString(payload.externalEventId),
      paymentId: toOptionalString(payload.paymentId),
      providerPaymentId: toOptionalString(payload.providerPaymentId),
      providerReference: toOptionalString(payload.providerReference),
      status: toOptionalPaymentStatus(payload.status),
      paymentMethod: toOptionalString(payload.paymentMethod),
      metadata: toMetadata(payload.metadata)
    };
  }
}
