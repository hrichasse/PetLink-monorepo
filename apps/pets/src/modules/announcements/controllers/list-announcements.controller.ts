import { NextRequest, NextResponse } from "next/server";

import { listAnnouncementsQuerySchema } from "@/modules/announcements/validators";
import { announcementsService } from "@/modules/announcements/services";
import { toAnnouncementResponseDto } from "@/modules/announcements/dtos";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { okPaginated, parsePagination, buildPaginationMeta, withPublicCache } from "@petlink/shared";

export const listAnnouncementsController = async (request: NextRequest): Promise<NextResponse> => {
  const searchParams = request.nextUrl.searchParams;
  const { page: _page, pageSize: _pageSize, ...rawFilters } = Object.fromEntries(searchParams.entries());
  const validationResult = listAnnouncementsQuerySchema.safeParse(rawFilters);

  if (!validationResult.success) {
    throw new AppError("Invalid announcement filters.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const pagination = parsePagination(searchParams);
  const { items, total } = await announcementsService.listAnnouncements(validationResult.data, pagination);

  return withPublicCache(
    okPaginated(
      "Announcements fetched successfully.",
      items.map((ann) => toAnnouncementResponseDto(ann)),
      buildPaginationMeta(pagination, total)
    )
  );
};
