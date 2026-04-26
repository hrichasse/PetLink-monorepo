import { Prisma, SubscriptionStatus } from "@prisma/client";

import type { PaymentModel } from "@/modules/payments/types";
import { getSubscriptionPlanByCode } from "@/modules/subscriptions/config/plans";
import type { CreateSubscriptionDto, SubscriptionResponseDto } from "@/modules/subscriptions/dtos";
import { subscriptionsRepository } from "@/modules/subscriptions/repositories";
import type { SubscriptionModel } from "@/modules/subscriptions/types";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { NotFoundError } from "@petlink/shared";

const addDays = (date: Date, days: number): Date => {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

const resolvePlanOrThrow = (planCode: string) => {
  const plan = getSubscriptionPlanByCode(planCode);

  if (!plan) {
    throw new AppError("Invalid subscription plan.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: {
        planCode
      }
    });
  }

  return plan;
};

const ensureNoConflictingActiveSubscription = async (authUserId: string, planCode: string): Promise<void> => {
  const activeSubscription = await subscriptionsRepository.findActiveByUserId(authUserId);

  if (!activeSubscription) {
    return;
  }

  if (activeSubscription.planCode === planCode) {
    throw new AppError("User already has an active subscription for this plan.", {
      statusCode: HTTP_STATUS.CONFLICT,
      code: ERROR_CODES.CONFLICT
    });
  }

  throw new AppError("User already has an active subscription.", {
    statusCode: HTTP_STATUS.CONFLICT,
    code: ERROR_CODES.CONFLICT
  });
};

export const subscriptionsService = {
  createSubscription: async (authUserId: string, payload: CreateSubscriptionDto): Promise<SubscriptionModel> => {
    resolvePlanOrThrow(payload.planCode);
    await ensureNoConflictingActiveSubscription(authUserId, payload.planCode);

    const existingPending = await subscriptionsRepository.findPendingByUserIdAndPlanCode(authUserId, payload.planCode);

    if (existingPending) {
      throw new AppError("User already has a pending subscription for this plan.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    return subscriptionsRepository.create(authUserId, payload);
  },

  ensurePendingSubscriptionForCheckout: async (
    authUserId: string,
    payload: CreateSubscriptionDto
  ): Promise<SubscriptionModel> => {
    const plan = resolvePlanOrThrow(payload.planCode);
    const existingSubscription = await subscriptionsRepository.findLatestManageableByUserIdAndPlanCode(authUserId, plan.code);

    if (existingSubscription) {
      return existingSubscription;
    }

    const activeSubscription = await subscriptionsRepository.findActiveByUserId(authUserId);

    if (activeSubscription && activeSubscription.planCode !== plan.code) {
      throw new AppError("User already has an active subscription for another plan.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    return subscriptionsRepository.create(authUserId, payload);
  },

  getMyActiveSubscription: async (authUserId: string): Promise<SubscriptionModel> => {
    const subscription = await subscriptionsRepository.findActiveByUserId(authUserId);

    if (!subscription) {
      throw new NotFoundError("Active subscription not found.");
    }

    return subscription;
  },

  cancelSubscriptionForUser: async (authUserId: string, subscriptionId: string): Promise<SubscriptionModel> => {
    const subscription = await subscriptionsRepository.findByIdForUser(subscriptionId, authUserId);

    if (!subscription) {
      throw new NotFoundError("Subscription not found.");
    }

    if (subscription.status === SubscriptionStatus.CANCELLED || subscription.status === SubscriptionStatus.EXPIRED) {
      throw new AppError("Subscription cannot be cancelled in its current status.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    const data: Prisma.SubscriptionUpdateInput = {
      status: SubscriptionStatus.CANCELLED,
      autoRenew: false
    };

    if (!subscription.endDate) {
      data.endDate = new Date();
    }

    return subscriptionsRepository.updateById(subscription.id, data);
  },

  activateOrRefreshSubscriptionFromApprovedPayment: async (payment: PaymentModel): Promise<SubscriptionModel> => {
    if (!payment.subscriptionId) {
      throw new AppError("Approved payment is not linked to a subscription.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    const subscription = await subscriptionsRepository.findById(payment.subscriptionId);

    if (!subscription) {
      throw new NotFoundError("Subscription not found for payment.");
    }

    const plan = resolvePlanOrThrow(subscription.planCode);
    const now = new Date();
    const effectiveStartBase =
      subscription.status === SubscriptionStatus.ACTIVE && subscription.endDate && subscription.endDate.getTime() > now.getTime()
        ? subscription.endDate
        : now;

    return subscriptionsRepository.updateById(subscription.id, {
      status: SubscriptionStatus.ACTIVE,
      provider: payment.provider,
      startDate: subscription.startDate ?? now,
      endDate: addDays(effectiveStartBase, plan.durationDays)
    });
  }
};
