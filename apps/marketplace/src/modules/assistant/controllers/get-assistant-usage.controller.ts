import { NextRequest, NextResponse } from "next/server";

import { requireAuth, ok } from "@petlink/shared";

import { assistantService } from "@/modules/assistant/services";

export const getAssistantUsageController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const usage = await assistantService.getUsage(authUser.userId);
  return ok("Uso del asistente.", usage);
};
