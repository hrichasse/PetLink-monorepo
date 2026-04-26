import { z } from "zod";

export const petIdParamsSchema = z.object({
  id: z.string().uuid("Invalid pet id.")
});