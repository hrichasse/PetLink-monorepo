import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@petlink/shared";
import { announcementIdParamsSchema } from "@/modules/announcements/validators";
import { announcementsService } from "@/modules/announcements/services";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";

type AnnouncementIdRouteParams = {
  params: { id: string };
};

export const deleteAnnouncementController = async (request: NextRequest, context: AnnouncementIdRouteParams): Promise<NextResponse> => {
  const authUser = await requireAuth(request);

  const paramsResult = announcementIdParamsSchema.safeParse(context.params);

  if (!paramsResult.success) {
    throw new AppError("Invalid announcement id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: paramsResult.error.flatten()
    });
  }

  await announcementsService.deleteAnnouncementForAuthor(authUser.userId, paramsResult.data.id);

  return ok("Announcement deleted successfully.", null);
};
