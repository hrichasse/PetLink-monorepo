import type { PaymentStatus } from "@prisma/client";

export type PaymentWebhookDto = {
  eventType: string;
  externalEventId?: string | undefined;
  paymentId?: string | undefined;
  providerPaymentId?: string | undefined;
  providerReference?: string | undefined;
  status?: PaymentStatus | undefined;
  paymentMethod?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
};
