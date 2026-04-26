import { NextRequest } from "next/server";

import { listMyPaymentsController } from "@/modules/payments/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function GET(request: NextRequest) {
  return withErrorHandler(() => listMyPaymentsController(request));
}
