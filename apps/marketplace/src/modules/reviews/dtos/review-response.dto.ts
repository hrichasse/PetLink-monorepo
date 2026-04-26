import type { ReviewModel } from "@/modules/reviews/types";

export type ReviewResponseDto = {
  id: string;
  bookingId: string;
  serviceId: string;
  providerId: string;
  authorId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export const toReviewResponseDto = (review: ReviewModel): ReviewResponseDto => {
  return {
    id: review.id,
    bookingId: review.bookingId,
    serviceId: review.serviceId,
    providerId: review.providerId,
    authorId: review.authorId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString()
  };
};