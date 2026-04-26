import type { PaymentProvider } from "@prisma/client";

import type { SubscriptionPlanCode } from "@/modules/subscriptions/types";

export type CreateSubscriptionDto = {
  planCode: SubscriptionPlanCode;
  provider?: PaymentProvider | undefined;
  autoRenew?: boolean | undefined;
};
