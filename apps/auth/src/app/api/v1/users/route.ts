import { NextRequest } from "next/server";

import { createUserProfileController } from "@/modules/users/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => createUserProfileController(request));
}
