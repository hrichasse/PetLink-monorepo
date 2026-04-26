import { z } from "zod";

export const bookingIdParamsSchema = z.object({
  id: z.string().uuid("Invalid booking id.")
});