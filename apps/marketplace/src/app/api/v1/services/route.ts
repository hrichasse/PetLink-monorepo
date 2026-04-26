import { NextRequest } from "next/server";

import { createServiceController, listServicesController } from "@/modules/services/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => createServiceController(request));
}

export async function GET(request: NextRequest) {
  return withErrorHandler(() => listServicesController(request));
}