import { z } from "zod";

export const healthRecordIdParamsSchema = z.object({
  id: z.string().uuid("Invalid health record id.")
});