import { NextRequest } from "next/server";

import { uploadMyAvatarController } from "@/modules/media/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => uploadMyAvatarController(request));
}