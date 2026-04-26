import { NextRequest, NextResponse } from "next/server";

import { listAnnouncementsQuerySchema } from "@/modules/announcements/validators";
import { announcementsService } from "@/modules/announcements/services";
import { toAnnouncementResponseDto } from "@/modules/announcements/dtos";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";

export const listAnnouncementsController = async (request: NextRequest): Promise<NextResponse> => {
  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
  const validationResult = listAnnouncementsQuerySchema.safeParse(rawQuery);

  if (!validationResult.success) {
    throw new AppError("Invalid announcement filters.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const announcements = await announcementsService.listAnnouncements(validationResult.data);

  return ok(
    "Announcements fetched successfully.",
    announcements.map((ann) => toAnnouncementResponseDto(ann))
  );
};
