import { NextRequest } from "next/server";

import { paymentWebhookController } from "@/modules/payments/controllers";
import { withErrorHandler } from "@petlink/shared";

type PaymentProviderRouteParams = {
  params: {
    provider: string;
  };
};

export async function POST(request: NextRequest, context: PaymentProviderRouteParams) {
  return withErrorHandler(() => paymentWebhookController(request, context));
}
