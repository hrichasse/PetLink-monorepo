import { PaymentProvider } from "@prisma/client";
import { z } from "zod";

import { SUBSCRIPTION_PLAN_CODES } from "@/modules/subscriptions/config/plans";

export const createSubscriptionSchema = z
  .object({
    planCode: z.enum(SUBSCRIPTION_PLAN_CODES),
    provider: z.nativeEnum(PaymentProvider).optional(),
    autoRenew: z.boolean().optional()
  })
  .strict();
