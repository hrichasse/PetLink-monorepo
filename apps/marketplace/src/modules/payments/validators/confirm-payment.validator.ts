import { z } from "zod";

const CONFIRMABLE_PAYMENT_STATUSES = ["APPROVED", "REJECTED", "CANCELLED", "FAILED"] as const;

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

export const confirmPaymentSchema = z
  .object({
    status: z.enum(CONFIRMABLE_PAYMENT_STATUSES),
    providerPaymentId: optionalNullableTrimmedString(191),
    providerReference: optionalNullableTrimmedString(191),
    paymentMethod: optionalNullableTrimmedString(120),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .strict();
