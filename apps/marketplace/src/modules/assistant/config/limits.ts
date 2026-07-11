import type { SubscriptionPlanCode } from "@/modules/subscriptions/types";

/** Daily assistant questions granted to users without an active subscription. */
export const FREE_DAILY_ASSISTANT_QUESTIONS = 5;

const DAILY_LIMITS_BY_PLAN: Record<SubscriptionPlanCode, number> = {
  BASIC: 15,
  PREMIUM: 35,
  PROVIDER_PRO: 80
};

/**
 * Resolves the daily question quota for the given active plan code.
 * A null/undefined/unknown code falls back to the Free tier.
 */
export const getDailyAssistantLimit = (planCode: string | null | undefined): number => {
  if (!planCode) return FREE_DAILY_ASSISTANT_QUESTIONS;
  return DAILY_LIMITS_BY_PLAN[planCode as SubscriptionPlanCode] ?? FREE_DAILY_ASSISTANT_QUESTIONS;
};
