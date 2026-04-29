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
  /**
   * Optional: Verify the authenticity of an incoming webhook request using provider-specific
   * signature headers. Return `true` if valid or if no secret is configured (dev mode).
   * Return `false` to reject the request with 401.
   */
  verifyWebhookRequest?(headers: Record<string, string | null>, rawBody: string): boolean;
}
