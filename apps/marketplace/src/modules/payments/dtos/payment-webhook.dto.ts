import type { PaymentStatus } from "@prisma/client";

export type PaymentWebhookDto = {
  eventType?: string | undefined;
  externalEventId?: string | undefined;
  paymentId?: string | undefined;
  providerPaymentId?: string | undefined;
  providerReference?: string | undefined;
  status?: PaymentStatus | undefined;
  paymentMethod?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  // MercadoPago native fields
  action?: string | undefined;
  type?: string | undefined;
  data?: Record<string, unknown> | undefined;
  // Transbank native fields
  token_ws?: string | undefined;
  TBK_TOKEN?: string | undefined;
  TBK_ORDEN_COMPRA?: string | undefined;
  TBK_ID_SESION?: string | undefined;
};
