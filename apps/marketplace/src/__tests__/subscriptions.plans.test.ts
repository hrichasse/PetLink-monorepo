import { describe, expect, it } from "@jest/globals";

import {
  getSubscriptionPlanByCode,
  listSubscriptionPlans,
  SUBSCRIPTION_PLAN_CODES,
} from "../modules/subscriptions/config/plans";

describe("getSubscriptionPlanByCode()", () => {
  it("returns the BASIC plan with correct fields", () => {
    const plan = getSubscriptionPlanByCode("BASIC");

    expect(plan).toBeDefined();
    expect(plan?.code).toBe("BASIC");
    expect(plan?.price).toBe(9900);
    expect(plan?.currency).toBe("CLP");
    expect(plan?.durationDays).toBe(30);
    expect(Array.isArray(plan?.features)).toBe(true);
  });

  it("returns the PREMIUM plan", () => {
    const plan = getSubscriptionPlanByCode("PREMIUM");

    expect(plan?.code).toBe("PREMIUM");
    expect(plan?.price).toBe(19900);
  });

  it("returns the PROVIDER_PRO plan", () => {
    const plan = getSubscriptionPlanByCode("PROVIDER_PRO");

    expect(plan?.code).toBe("PROVIDER_PRO");
    expect(plan?.price).toBe(29900);
  });

  it("returns undefined for an unknown plan code", () => {
    const plan = getSubscriptionPlanByCode("UNKNOWN_PLAN");
    expect(plan).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    const plan = getSubscriptionPlanByCode("");
    expect(plan).toBeUndefined();
  });
});

describe("listSubscriptionPlans()", () => {
  it("returns all defined plans", () => {
    const plans = listSubscriptionPlans();
    expect(plans).toHaveLength(SUBSCRIPTION_PLAN_CODES.length);
  });

  it("contains all expected plan codes", () => {
    const codes = listSubscriptionPlans().map((p) => p.code);
    expect(codes).toEqual(expect.arrayContaining(["BASIC", "PREMIUM", "PROVIDER_PRO"]));
  });

  it("every plan has required fields", () => {
    for (const plan of listSubscriptionPlans()) {
      expect(plan.code).toBeTruthy();
      expect(plan.name).toBeTruthy();
      expect(plan.price).toBeGreaterThan(0);
      expect(plan.currency).toBe("CLP");
      expect(plan.durationDays).toBeGreaterThan(0);
      expect((plan.features ?? []).length).toBeGreaterThan(0);
    }
  });
});
