import { BookingStatus } from "@prisma/client";
import { z } from "zod";

export const updateBookingStatusSchema = z
  .object({
    status: z.nativeEnum(BookingStatus),
    notes: z
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