import { z } from "zod";

export const veterinaryIdParamsSchema = z.object({
  id: z.string().uuid("Invalid veterinary id.")
});
