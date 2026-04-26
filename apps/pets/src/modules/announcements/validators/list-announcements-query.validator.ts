import { AnnouncementType } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  });

export const listAnnouncementsQuerySchema = z
  .object({
    type: z.nativeEnum(AnnouncementType).optional(),
    city: optionalTrimmedString,
    authorId: z.string().uuid().optional(),
    isActive: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return undefined;
        }

        return value === "true";
      })
  })
  .strict();
