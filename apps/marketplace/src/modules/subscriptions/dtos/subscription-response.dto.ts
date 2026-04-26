import type { PaymentProvider, SubscriptionStatus } from "@prisma/client";

import type { SubscriptionModel } from "@/modules/subscriptions/types";

export type SubscriptionResponseDto = {
  id: string;
  planCode: string;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  autoRenew: boolean;
  provider: PaymentProvider | null;
  createdAt: string;
  updatedAt: string;
};

export const toSubscriptionResponseDto = (subscription: SubscriptionModel): SubscriptionResponseDto => {
  return {
    id: subscription.id,
    planCode: subscription.planCode,
    status: subscription.status,
    startDate: subscription.startDate?.toISOString() ?? null,
    endDate: subscription.endDate?.toISOString() ?? null,
    autoRenew: subscription.autoRenew,
    provider: subscription.provider ?? null,
    createdAt: subscription.createdAt.toISOString(),
    updatedAt: subscription.updatedAt.toISOString()
  };
};
