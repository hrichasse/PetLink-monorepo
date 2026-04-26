import type { Booking, Prisma } from "@prisma/client";

import { prisma } from "@petlink/database";
import type { CreateReviewDto } from "@/modules/reviews/dtos";
import type { ReviewModel } from "@/modules/reviews/types";

const toCreateInput = (authUserId: string, booking: Booking, payload: CreateReviewDto): Prisma.ReviewCreateInput => {
  const data: Prisma.ReviewCreateInput = {
    booking: {
      connect: {
        id: booking.id
      }
    },
    service: {
      connect: {
        id: booking.serviceId
      }
    },
    provider: {
      connect: {
        userId: booking.providerId
      }
    },
    author: {
      connect: {
        userId: authUserId
      }
    },
    rating: payload.rating
  };

  if (payload.comment !== undefined) {
    data.comment = payload.comment;
  }

  return data;
};

export const reviewsRepository = {
  findBookingById: (id: string): Promise<Booking | null> => {
    return prisma.booking.findUnique({
      where: { id }
    });
  },

  findByBookingId: (bookingId: string): Promise<ReviewModel | null> => {
    return prisma.review.findUnique({
      where: { bookingId }
    });
  },

  create: (authUserId: string, booking: Booking, payload: CreateReviewDto): Promise<ReviewModel> => {
    return prisma.review.create({
      data: toCreateInput(authUserId, booking, payload)
    });
  },

  findManyByServiceId: (serviceId: string): Promise<ReviewModel[]> => {
    return prisma.review.findMany({
      where: { serviceId },
      orderBy: { createdAt: "desc" }
    });
  },

  findManyByProviderId: (providerId: string): Promise<ReviewModel[]> => {
    return prisma.review.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" }
    });
  }
};