import { NextRequest } from "next/server";

import { confirmPaymentController } from "@/modules/payments/controllers";
import { withErrorHandler } from "@petlink/shared";

type PaymentIdRouteParams = {
  params: {
    id: string;
  };
};

export async function POST(request: NextRequest, context: PaymentIdRouteParams) {
  return withErrorHandler(() => confirmPaymentController(request, context));
}
