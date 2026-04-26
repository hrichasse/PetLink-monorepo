import type { PaymentStatus, Prisma } from "@prisma/client";

import type { ConfirmPaymentDto, CreateCheckoutDto } from "@/modules/payments/dtos";
import { paymentsRepository } from "@/modules/payments/repositories";
import type { PaymentCheckoutSession, PaymentModel } from "@/modules/payments/types";
import { paymentProviderFactory } from "@/modules/payments/providers";
import { getSubscriptionPlanByCode } from "@/modules/subscriptions/config/plans";
import { subscriptionsRepository } from "@/modules/subscriptions/repositories";
import { subscriptionsService } from "@/modules/subscriptions/services";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { NotFoundError } from "@petlink/shared";

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

const toMetadataRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const mergeMetadata = (...chunks: Array<unknown>): Prisma.InputJsonValue | undefined => {
  const merged = chunks.reduce<Record<string, unknown>>((accumulator, currentChunk) => {
    return {
      ...accumulator,
      ...toMetadataRecord(currentChunk)
    };
  }, {});

  return Object.keys(merged).length === 0 ? undefined : (merged as Prisma.InputJsonObject);
};

const buildPaymentUpdateInput = (payload: {
  status?: PaymentStatus | undefined;
  providerPaymentId?: string | null | undefined;
  providerReference?: string | null | undefined;
  paymentMethod?: string | null | undefined;
  paidAt?: Date | undefined;
  metadata?: Prisma.InputJsonValue | undefined;
}): Prisma.PaymentUpdateInput => {
  const data: Prisma.PaymentUpdateInput = {};

  if (payload.status !== undefined) {
    data.status = payload.status;
  }

  if (payload.providerPaymentId !== undefined) {
    data.providerPaymentId = payload.providerPaymentId;
  }

  if (payload.providerReference !== undefined) {
    data.providerReference = payload.providerReference;
  }

  if (payload.paymentMethod !== undefined) {
    data.paymentMethod = payload.paymentMethod;
  }

  if (payload.paidAt !== undefined) {
    data.paidAt = payload.paidAt;
  }

  if (payload.metadata !== undefined) {
    data.metadata = payload.metadata;
  }

  return data;
};

export const paymentsService = {
  createCheckout: async (
    authUserId: string,
    payload: CreateCheckoutDto
  ): Promise<{ payment: PaymentModel; checkout: PaymentCheckoutSession }> => {
    const plan = resolvePlanOrThrow(payload.planCode);

    const subscription = payload.subscriptionId
      ? await subscriptionsRepository.findByIdForUser(payload.subscriptionId, authUserId)
      : await subscriptionsService.ensurePendingSubscriptionForCheckout(authUserId, {
          planCode: payload.planCode,
          provider: payload.provider,
          autoRenew: payload.autoRenew
        });

    if (!subscription) {
      throw new NotFoundError("Subscription not found.");
    }

    if (subscription.planCode !== plan.code) {
      throw new AppError("Subscription plan does not match checkout plan.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    if (subscription.status === "CANCELLED" || subscription.status === "EXPIRED") {
      throw new AppError("Subscription cannot receive payments in its current status.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    const payment = await paymentsRepository.createPendingCheckout(authUserId, subscription.id, payload.provider, plan);
    const provider = paymentProviderFactory.create(payload.provider);
    const checkout = await provider.createCheckout({
      paymentId: payment.id,
      userId: authUserId,
      subscriptionId: subscription.id,
      planCode: plan.code,
      amount: plan.price,
      currency: plan.currency,
      description: `${plan.name} subscription`
    });

    const updatedPayment = await paymentsRepository.updateById(
      payment.id,
      buildPaymentUpdateInput({
        providerPaymentId: checkout.providerPaymentId,
        providerReference: checkout.providerReference,
        metadata: mergeMetadata(payment.metadata, checkout.metadata)
      })
    );

    return {
      payment: updatedPayment,
      checkout
    };
  },

  listMyPayments: (authUserId: string): Promise<PaymentModel[]> => {
    return paymentsRepository.findManyByUserId(authUserId);
  },

  getPaymentByIdForUser: async (authUserId: string, paymentId: string): Promise<PaymentModel> => {
    const payment = await paymentsRepository.findByIdForUser(paymentId, authUserId);

    if (!payment) {
      throw new NotFoundError("Payment not found.");
    }

    return payment;
  },

  confirmPaymentForUser: async (
    authUserId: string,
    paymentId: string,
    payload: ConfirmPaymentDto
  ): Promise<PaymentModel> => {
    const payment = await paymentsService.getPaymentByIdForUser(authUserId, paymentId);

    if (payment.status !== "PENDING") {
      throw new AppError("Only pending payments can be confirmed manually.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    const nextStatus = payload.status as PaymentStatus;
    const updatedPayment = await paymentsRepository.updateById(
      payment.id,
      buildPaymentUpdateInput({
        status: nextStatus,
        providerPaymentId: payload.providerPaymentId ?? payment.providerPaymentId,
        providerReference: payload.providerReference ?? payment.providerReference,
        paymentMethod: payload.paymentMethod,
        paidAt: nextStatus === "APPROVED" ? new Date() : undefined,
        metadata: mergeMetadata(payment.metadata, payload.metadata)
      })
    );

    if (updatedPayment.status === "APPROVED") {
      await subscriptionsService.activateOrRefreshSubscriptionFromApprovedPayment(updatedPayment);
    }

    return updatedPayment;
  }
};
