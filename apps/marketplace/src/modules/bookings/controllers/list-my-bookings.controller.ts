import { NextRequest, NextResponse } from "next/server";

import { listBookingsQuerySchema } from "@/modules/bookings/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { okPaginated, parsePagination, buildPaginationMeta } from "@petlink/shared";
import { toBookingResponseDto } from "@/modules/bookings/dtos";
import { bookingsService } from "@/modules/bookings/services";

export const listMyBookingsController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const searchParams = request.nextUrl.searchParams;
  const { page: _page, pageSize: _pageSize, ...rawFilters } = Object.fromEntries(searchParams.entries());
  const validationResult = listBookingsQuerySchema.safeParse(rawFilters);

  if (!validationResult.success) {
    throw new AppError("Invalid booking filters.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const pagination = parsePagination(searchParams);
  const { items, total } = await bookingsService.listMyBookings(authUser.userId, validationResult.data, pagination);

  return okPaginated(
    "Bookings fetched successfully.",
    items.map((booking) => toBookingResponseDto(booking)),
    buildPaginationMeta(pagination, total)
  );
};