import { NextRequest } from "next/server";

import { getMeController, updateMeController } from "@/modules/users/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function GET(request: NextRequest) {
  return withErrorHandler(() => getMeController(request));
}

export async function PATCH(request: NextRequest) {
  return withErrorHandler(() => updateMeController(request));
}