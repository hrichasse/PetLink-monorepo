import { NextRequest } from "next/server";

import { findCompatiblePetsController } from "@/modules/match/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function GET(request: NextRequest) {
  return withErrorHandler(() => findCompatiblePetsController(request));
}