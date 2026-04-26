import { HealthRecordType } from "@prisma/client";
import { z } from "zod";

export const updateHealthRecordSchema = z
  .object({
    type: z.nativeEnum(HealthRecordType).optional(),
    recordDate: z.coerce.date().optional(),
    description: z.string().trim().min(5).max(2000).optional(),
    notes: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value) => {
        if (typeof value === "string") {
          const trimmed = value.trim();
          return trimmed.length === 0 ? null : trimmed;
        }

        return value;
      }),
    nextDueDate: z
      .union([z.coerce.date(), z.null()])
      .optional()
      .transform((value) => {
        return value ?? null;
      })
  })
  .strict()
  .superRefine((payload, ctx) => {
    if (payload.recordDate && payload.nextDueDate && payload.nextDueDate.getTime() < payload.recordDate.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "nextDueDate must be greater than or equal to recordDate.",
        path: ["nextDueDate"]
      });
    }
  });