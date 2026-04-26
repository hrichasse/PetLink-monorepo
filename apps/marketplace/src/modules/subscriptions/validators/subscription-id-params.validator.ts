import { z } from "zod";

export const subscriptionIdParamsSchema = z.object({
  id: z.string().uuid("Invalid subscription id.")
});
