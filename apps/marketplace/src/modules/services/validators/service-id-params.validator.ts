import { z } from "zod";

export const serviceIdParamsSchema = z.object({
  id: z.string().uuid("Invalid service id.")
});