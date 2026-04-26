import { NextRequest } from "next/server";

import { createAnnouncementController, listAnnouncementsController } from "@/modules/announcements/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => createAnnouncementController(request));
}

export async function GET(request: NextRequest) {
  return withErrorHandler(() => listAnnouncementsController(request));
}
