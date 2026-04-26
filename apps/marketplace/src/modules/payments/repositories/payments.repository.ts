import type { Payment, PaymentProvider, PaymentStatus, PaymentWebhookEvent, Prisma } from "@prisma/client";

import { prisma } from "@petlink/database";
import type { CreateCheckoutDto, PaymentWebhookDto } from "@/modules/payments/dtos";
import type { PaymentModel, PaymentWebhookEventModel } from "@/modules/payments/types";
import type { SubscriptionPlan } from "@/modules/subscriptions/types";

const toCreatePaymentInput = (
  authUserId: string,
  subscriptionId: string,
  provider: PaymentProvider,
  plan: SubscriptionPlan
): Prisma.PaymentCreateInput => {
  return {
    user: {
      connect: {
        userId: authUserId
      }
    },
    subscription: {
      connect: {
        id: subscriptionId
      }
    },
    provider,
    status: "PENDING",
    amount: plan.price,
    currency: plan.currency,
    description: `${plan.name} subscription`,
    metadata: {
      planCode: plan.code,
      planName: plan.name,
      durationDays: plan.durationDays
    }
  };
};

export const paymentsRepository = {
  createPendingCheckout: (
    authUserId: string,
    subscriptionId: string,
    provider: PaymentProvider,
    plan: SubscriptionPlan
  ): Promise<PaymentModel> => {
    return prisma.payment.create({
      data: toCreatePaymentInput(authUserId, subscriptionId, provider, plan)
    });
  },

  findById: (id: string): Promise<Payment | null> => {
    return prisma.payment.findUnique({
      where: { id }
    });
  },

  findByIdForUser: (id: string, userId: string): Promise<Payment | null> => {
    return prisma.payment.findFirst({
      where: {
        id,
        userId
      }
    });
  },

  findManyByUserId: (userId: string): Promise<PaymentModel[]> => {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc"
      }
    });
  },

  updateById: (id: string, data: Prisma.PaymentUpdateInput): Promise<PaymentModel> => {
    return prisma.payment.update({
      where: { id },
      data
    });
  },

  findByProviderPaymentId: (provider: PaymentProvider, providerPaymentId: string): Promise<Payment | null> => {
    return prisma.payment.findFirst({
      where: {
        provider,
        providerPaymentId
      }
    });
  },

  findByProviderReference: (provider: PaymentProvider, providerReference: string): Promise<Payment | null> => {
    return prisma.payment.findFirst({
      where: {
        provider,
        providerReference
      }
    });
  },

  findWebhookEventByProviderAndExternalEventId: (
    provider: PaymentProvider,
    externalEventId: string
  ): Promise<PaymentWebhookEvent | null> => {
    return prisma.paymentWebhookEvent.findFirst({
      where: {
        provider,
        externalEventId
      }
    });
  },

  createWebhookEvent: (
    provider: PaymentProvider,
    eventType: string,
    externalEventId: string | undefined,
    payload: Prisma.InputJsonValue
  ): Promise<PaymentWebhookEventModel> => {
    const data: Prisma.PaymentWebhookEventCreateInput = {
      provider,
      eventType,
      payload
    };

    if (externalEventId !== undefined) {
      data.externalEventId = externalEventId;
    }

    return prisma.paymentWebhookEvent.create({
      data
    });
  },

  markWebhookEventProcessed: (id: string): Promise<PaymentWebhookEventModel> => {
    return prisma.paymentWebhookEvent.update({
      where: { id },
      data: {
        processed: true,
        processedAt: new Date()
      }
    });
  }
};
