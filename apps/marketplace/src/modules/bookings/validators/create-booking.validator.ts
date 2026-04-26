import { z } from "zod";

export const createBookingSchema = z
  .object({
    petId: z.string().uuid(),
    serviceId: z.string().uuid(),
    bookingDate: z.coerce.date(),
    durationHours: z.number().int().positive().max(720).optional(),
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