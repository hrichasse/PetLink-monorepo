import { z } from "zod";

export const findCompatiblePetsQuerySchema = z
  .object({
    petId: z.string().uuid(),
    limit: z
      .coerce
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
  })
  .strict();