import type { PaymentProvider as PrismaPaymentProvider, PaymentStatus } from "@prisma/client";

import type { PaymentCheckoutSession, PaymentWebhookResolution } from "@/modules/payments/types";

export type CreateProviderCheckoutInput = {
  paymentId: string;
  userId: string;
  subscriptionId?: string | undefined;
  planCode: string;
  amount: number;
  currency: string;
  description: string;
};

export type ParsedProviderWebhook = Omit<PaymentWebhookResolution, "status"> & {
  status?: PaymentStatus | undefined;
};

export interface PaymentProviderAdapter {
  readonly provider: PrismaPaymentProvider;
  createCheckout(input: CreateProviderCheckoutInput): Promise<PaymentCheckoutSession>;
  parseWebhookPayload(payload: Record<string, unknown>): Promise<ParsedProviderWebhook>;
}
