import { PetSex } from "@prisma/client";
import { z } from "zod";

export const createPetSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    species: z.string().trim().min(1).max(80),
    breed: z.string().trim().min(1).max(120),
    age: z.number().int().min(0).max(100),
    weight: z.number().positive().max(500),
    sex: z.nativeEnum(PetSex),
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
    isSterilized: z.boolean().default(false),
    isVaccinated: z.boolean().default(false)
  })
  .strict();