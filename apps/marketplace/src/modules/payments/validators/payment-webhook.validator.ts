import { PaymentStatus } from "@prisma/client";
import { z } from "zod";

const optionalTrimmedString = (maxLength: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maxLength)
    .optional();

export const paymentWebhookSchema = z
  .object({
    eventType: z.string().trim().min(1).max(120),
    externalEventId: optionalTrimmedString(191),
    paymentId: z.string().uuid().optional(),
    providerPaymentId: optionalTrimmedString(191),
    providerReference: optionalTrimmedString(191),
    status: z.nativeEnum(PaymentStatus).optional(),
    paymentMethod: optionalTrimmedString(120),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .passthrough();
