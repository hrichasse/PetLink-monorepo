import { PetSex } from "@prisma/client";
import { z } from "zod";

const optionalNullableTrimmedString = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed.length === 0 ? null : trimmed;
      }

      return value;
    })
    .refine((value) => value === undefined || value === null || value.length <= max, {
      message: `Value must be at most ${max} characters.`
    });

export const upsertMatchPreferenceSchema = z
  .object({
    petId: z.string().uuid(),
    preferredBreed: optionalNullableTrimmedString(120),
    preferredSex: z.union([z.nativeEnum(PetSex), z.null()]).optional(),
    minAge: z.union([z.number().int().min(0).max(100), z.null()]).optional(),
    maxAge: z.union([z.number().int().min(0).max(100), z.null()]).optional(),
    preferredLocation: optionalNullableTrimmedString(120),
    healthRequirements: optionalNullableTrimmedString(300)
  })
  .strict()
  .superRefine((payload, ctx) => {
    if (
      payload.minAge !== undefined &&
      payload.minAge !== null &&
      payload.maxAge !== undefined &&
      payload.maxAge !== null &&
      payload.maxAge < payload.minAge
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "maxAge must be greater than or equal to minAge.",
        path: ["maxAge"]
      });
    }
  });