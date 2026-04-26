import { z } from "zod";

const optionalNullableTrimmedString = (maxLength: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (typeof value === "string") {
        const trimmedValue = value.trim();
        return trimmedValue.length === 0 ? null : trimmedValue;
      }

      return value;
    })
    .refine((value) => value === undefined || value === null || value.length <= maxLength, {
      message: `Value must be at most ${maxLength} characters.`
    });

export const updateUserProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: optionalNullableTrimmedString(30),
    city: optionalNullableTrimmedString(80)
  })
  .strict();