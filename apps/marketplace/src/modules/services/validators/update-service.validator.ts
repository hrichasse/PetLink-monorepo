import { ServiceType } from "@prisma/client";
import { z } from "zod";

export const updateServiceSchema = z
  .object({
    type: z.nativeEnum(ServiceType).optional(),
    title: z.string().trim().min(3).max(160).optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    price: z.number().positive().max(1000000).optional(),
    location: z.string().trim().min(2).max(160).optional(),
    availabilityNotes: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => {
        if (typeof value === "string") {
          const trimmedValue = value.trim();
          return trimmedValue.length === 0 ? null : trimmedValue;
        }

        return value;
      }),
    isActive: z.boolean().optional()
  })
  .strict();