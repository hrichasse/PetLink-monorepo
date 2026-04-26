import { NextRequest } from "next/server";

import { createCheckoutController } from "@/modules/payments/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => createCheckoutController(request));
}
