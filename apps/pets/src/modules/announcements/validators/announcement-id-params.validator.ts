import { z } from "zod";

export const announcementIdParamsSchema = z.object({
  id: z.string().uuid("Invalid announcement id.")
});
