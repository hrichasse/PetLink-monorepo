import { z } from "zod";

export const petIdParamsSchema = z.object({
  petId: z.string().uuid("Invalid pet id.")
});