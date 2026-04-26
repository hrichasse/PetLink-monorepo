import { z } from "zod";

export const createReviewSchema = z
  .object({
    bookingId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => {
        if (typeof value === "string") {
          const trimmed = value.trim();
          return trimmed.length === 0 ? null : trimmed;
        }

        return value;
      })
  })
  .strict();