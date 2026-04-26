import type { SubscriptionPlan, SubscriptionPlanCode } from "@/modules/subscriptions/types";

export const SUBSCRIPTION_PLAN_CODES = ["BASIC", "PREMIUM", "PROVIDER_PRO"] as const;

const SUBSCRIPTION_PLANS: Record<SubscriptionPlanCode, SubscriptionPlan> = {
  BASIC: {
    code: "BASIC",
    name: "Basic",
    price: 9900,
    currency: "CLP",
    durationDays: 30,
    features: ["Perfil activo", "Acceso a funcionalidades base"]
  },
  PREMIUM: {
    code: "PREMIUM",
    name: "Premium",
    price: 19900,
    currency: "CLP",
    durationDays: 30,
    features: ["Mayor visibilidad", "Beneficios premium"]
  },
  PROVIDER_PRO: {
    code: "PROVIDER_PRO",
    name: "Provider Pro",
    price: 29900,
    currency: "CLP",
    durationDays: 30,
    features: ["Herramientas avanzadas para proveedores", "Prioridad en resultados"]
  }
};

export const listSubscriptionPlans = (): SubscriptionPlan[] => {
  return Object.values(SUBSCRIPTION_PLANS);
};

export const getSubscriptionPlanByCode = (code: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS[code as SubscriptionPlanCode];
};
