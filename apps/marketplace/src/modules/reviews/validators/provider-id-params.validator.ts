import { z } from "zod";

export const providerIdParamsSchema = z.object({
  providerId: z.string().uuid("Invalid provider id.")
});