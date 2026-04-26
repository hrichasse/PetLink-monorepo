import { NextResponse } from "next/server";

import { announcementIdParamsSchema } from "@/modules/announcements/validators";
import { announcementsService } from "@/modules/announcements/services";
import { toAnnouncementResponseDto } from "@/modules/announcements/dtos";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";

type AnnouncementIdRouteParams = {
  params: { id: string };
};

export const getAnnouncementByIdController = async (context: AnnouncementIdRouteParams): Promise<NextResponse> => {
  const validationResult = announcementIdParamsSchema.safeParse(context.params);

  if (!validationResult.success) {
    throw new AppError("Invalid announcement id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const announcement = await announcementsService.getAnnouncementById(validationResult.data.id);

  return ok("Announcement fetched successfully.", toAnnouncementResponseDto(announcement));
};
