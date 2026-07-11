import { NextRequest } from "next/server";

import { getAssistantUsageController } from "@/modules/assistant/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function GET(request: NextRequest) {
  return withErrorHandler(() => getAssistantUsageController(request));
}
