import { NextRequest } from "next/server";

import { upsertMatchPreferenceController } from "@/modules/match/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => upsertMatchPreferenceController(request));
}