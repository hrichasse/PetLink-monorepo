import type { Prisma, Subscription, SubscriptionStatus } from "@prisma/client";

import { prisma } from "@petlink/database";
import type { CreateSubscriptionDto } from "@/modules/subscriptions/dtos";
import type { SubscriptionModel } from "@/modules/subscriptions/types";

const toCreateInput = (userId: string, payload: CreateSubscriptionDto): Prisma.SubscriptionCreateInput => {
  const data: Prisma.SubscriptionCreateInput = {
    user: {
      connect: {
        userId
      }
    },
    planCode: payload.planCode,
    status: "PENDING",
    autoRenew: payload.autoRenew ?? true
  };

  if (payload.provider !== undefined) {
    data.provider = payload.provider;
  }

  return data;
};

export const subscriptionsRepository = {
  create: (userId: string, payload: CreateSubscriptionDto): Promise<SubscriptionModel> => {
    return prisma.subscription.create({
      data: toCreateInput(userId, payload)
    });
  },

  findById: (id: string): Promise<Subscription | null> => {
    return prisma.subscription.findUnique({
      where: { id }
    });
  },

  findByIdForUser: (id: string, userId: string): Promise<Subscription | null> => {
    return prisma.subscription.findFirst({
      where: {
        id,
        userId
      }
    });
  },

  findActiveByUserId: (userId: string): Promise<Subscription | null> => {
    return prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE"
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
  },

  findPendingByUserIdAndPlanCode: (userId: string, planCode: string): Promise<Subscription | null> => {
    return prisma.subscription.findFirst({
      where: {
        userId,
        planCode,
        status: "PENDING"
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
  },

  findLatestManageableByUserIdAndPlanCode: (userId: string, planCode: string): Promise<Subscription | null> => {
    return prisma.subscription.findFirst({
      where: {
        userId,
        planCode,
        status: {
          in: ["PENDING", "ACTIVE", "PAST_DUE"]
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
  },

  updateById: (id: string, data: Prisma.SubscriptionUpdateInput): Promise<SubscriptionModel> => {
    return prisma.subscription.update({
      where: { id },
      data
    });
  },

  findLatestByUserId: (userId: string): Promise<Subscription | null> => {
    return prisma.subscription.findFirst({
      where: { userId },
      orderBy: {
        updatedAt: "desc"
      }
    });
  }
};
