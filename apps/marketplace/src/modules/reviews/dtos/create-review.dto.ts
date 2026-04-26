export type CreateReviewDto = {
  bookingId: string;
  rating: number;
  comment?: string | null | undefined;
};