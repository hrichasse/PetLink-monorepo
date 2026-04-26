import type { PaymentProvider } from "@prisma/client";

import type { SubscriptionPlanCode } from "@/modules/subscriptions/types";

export type CreateCheckoutDto = {
  planCode: SubscriptionPlanCode;
  provider: PaymentProvider;
  subscriptionId?: string | undefined;
  autoRenew?: boolean | undefined;
};
