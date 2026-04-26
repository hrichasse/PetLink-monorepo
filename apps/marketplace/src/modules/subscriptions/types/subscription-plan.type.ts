export type SubscriptionPlanCode = "BASIC" | "PREMIUM" | "PROVIDER_PRO";

export type SubscriptionPlan = {
  code: SubscriptionPlanCode;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  features?: string[] | undefined;
};
