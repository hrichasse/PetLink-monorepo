import { NextRequest } from "next/server";

import { askAssistantController } from "@/modules/assistant/controllers";
import { withErrorHandler, withRateLimit } from "@petlink/shared";

// Daily quota is enforced per-plan in the service; this per-IP limiter is just a
// coarse anti-hammer guard on top of it.
export async function POST(request: NextRequest) {
  return withErrorHandler(() =>
    withRateLimit(request, { bucket: "assistant:ask", limit: 20, windowMs: 60_000 }, () =>
      askAssistantController(request)
    )
  );
}
