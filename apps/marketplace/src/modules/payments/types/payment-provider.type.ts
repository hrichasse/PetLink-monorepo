export type PaymentCheckoutSession = {
  checkoutUrl: string | null;
  providerPaymentId: string | null;
  providerReference: string | null;
  metadata?: Record<string, unknown> | undefined;
};

export type PaymentWebhookResolution = {
  eventType: string;
  externalEventId?: string | undefined;
  paymentId?: string | undefined;
  providerPaymentId?: string | undefined;
  providerReference?: string | undefined;
  status?: string | undefined;
  paymentMethod?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
};
