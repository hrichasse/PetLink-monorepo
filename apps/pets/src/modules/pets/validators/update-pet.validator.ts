import { PetSex } from "@prisma/client";
import { z } from "zod";

export const updatePetSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    species: z.string().trim().min(1).max(80).optional(),
    breed: z.string().trim().min(1).max(120).optional(),
    age: z.number().int().min(0).max(100).optional(),
    weight: z.number().positive().max(500).optional(),
    sex: z.nativeEnum(PetSex).optional(),
    description: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => {
        if (typeof value === "string") {
          const trimmedValue = value.trim();
          return trimmedValue.length === 0 ? null : trimmedValue;
        }

        return value;
      }),
    isSterilized: z.boolean().optional(),
    isVaccinated: z.boolean().optional()
  })
  .strict();