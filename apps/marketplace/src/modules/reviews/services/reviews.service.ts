import { BookingStatus } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import type { CreateReviewDto } from "@/modules/reviews/dtos";
import { reviewsRepository } from "@/modules/reviews/repositories";
import type { ReviewModel } from "@/modules/reviews/types";
import type { Paginated, PaginationParams } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { NotFoundError } from "@petlink/shared";

export const reviewsService = {
  createReview: async (authUserId: string, payload: CreateReviewDto): Promise<ReviewModel> => {
    const booking = await reviewsRepository.findBookingById(payload.bookingId);

    if (!booking) {
      throw new NotFoundError("Booking not found.");
    }

    if (booking.ownerId !== authUserId) {
      throw new AppError("Only booking owner can create a review.", {
        statusCode: HTTP_STATUS.FORBIDDEN,
        code: ERROR_CODES.FORBIDDEN
      });
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new AppError("Only completed bookings can be reviewed.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    const existingReview = await reviewsRepository.findByBookingId(booking.id);

    if (existingReview) {
      throw new AppError("This booking already has a review.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    try {
      return await reviewsRepository.create(authUserId, booking, payload);
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError("This booking already has a review.", {
          statusCode: HTTP_STATUS.CONFLICT,
          code: ERROR_CODES.CONFLICT
        });
      }
      throw err;
    }
  },

  listReviewsByService: (serviceId: string, pagination: PaginationParams): Promise<Paginated<ReviewModel>> => {
    return reviewsRepository.findManyByServiceId(serviceId, pagination);
  },

  listReviewsByProvider: (providerId: string, pagination: PaginationParams): Promise<Paginated<ReviewModel>> => {
    return reviewsRepository.findManyByProviderId(providerId, pagination);
  }
};