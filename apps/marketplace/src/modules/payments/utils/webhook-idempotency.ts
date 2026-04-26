import type { PaymentProvider } from "@prisma/client";

import type { PaymentWebhookEventModel } from "@/modules/payments/types";

export const buildWebhookEventLookup = (provider: PaymentProvider, externalEventId?: string | null) => {
  if (!externalEventId) {
    return null;
  }

  return {
    provider,
    externalEventId
  };
};

export const isWebhookEventAlreadyProcessed = (event: PaymentWebhookEventModel | null): boolean => {
  return Boolean(event?.processed);
};
