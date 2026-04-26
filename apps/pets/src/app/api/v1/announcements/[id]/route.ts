import { NextRequest } from "next/server";

import { deleteAnnouncementController, getAnnouncementByIdController, updateAnnouncementController } from "@/modules/announcements/controllers";
import { withErrorHandler } from "@petlink/shared";

type AnnouncementIdRouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_: NextRequest, context: AnnouncementIdRouteParams) {
  return withErrorHandler(() => getAnnouncementByIdController(context));
}

export async function PATCH(request: NextRequest, context: AnnouncementIdRouteParams) {
  return withErrorHandler(() => updateAnnouncementController(request, context));
}

export async function DELETE(request: NextRequest, context: AnnouncementIdRouteParams) {
  return withErrorHandler(() => deleteAnnouncementController(request, context));
}
