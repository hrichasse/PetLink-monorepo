import { z } from "zod";

export const serviceIdParamsSchema = z.object({
  serviceId: z.string().uuid("Invalid service id.")
});