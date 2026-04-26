import { z } from "zod";

export const listBookingsQuerySchema = z
  .object({
    role: z.enum(["owner", "provider"]).optional()
  })
  .strict();