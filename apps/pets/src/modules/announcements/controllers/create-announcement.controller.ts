import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@petlink/shared";
import { createAnnouncementSchema } from "@/modules/announcements/validators";
import { announcementsService } from "@/modules/announcements/services";
import { toAnnouncementResponseDto } from "@/modules/announcements/dtos";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { created } from "@petlink/shared";

const parseBody = async (request: NextRequest): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
};

export const createAnnouncementController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const body = await parseBody(request);
  const validationResult = createAnnouncementSchema.safeParse(body);

  if (!validationResult.success) {
    throw new AppError("Invalid create announcement payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const announcement = await announcementsService.createAnnouncement(authUser.userId, validationResult.data);

  return created("Announcement created successfully.", toAnnouncementResponseDto(announcement));
};
