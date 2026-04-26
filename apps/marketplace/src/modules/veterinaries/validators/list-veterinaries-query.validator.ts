import { VeterinarySpecialty } from "@prisma/client";
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

export const listVeterinariesQuerySchema = z
  .object({
    city: optionalTrimmedString,
    specialty: z.nativeEnum(VeterinarySpecialty).optional(),
    isPartner: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return undefined;
        }

        return value === "true";
      }),
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
