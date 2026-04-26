import { PaymentProvider } from "@prisma/client";
import { z } from "zod";

export const paymentProviderParamsSchema = z.object({
  provider: z.nativeEnum(PaymentProvider)
});
