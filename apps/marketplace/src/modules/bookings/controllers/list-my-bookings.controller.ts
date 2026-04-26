import { NextRequest, NextResponse } from "next/server";

import { listBookingsQuerySchema } from "@/modules/bookings/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";
import { toBookingResponseDto } from "@/modules/bookings/dtos";
import { bookingsService } from "@/modules/bookings/services";

export const listMyBookingsController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
  const validationResult = listBookingsQuerySchema.safeParse(rawQuery);

  if (!validationResult.success) {
    throw new AppError("Invalid booking filters.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const bookings = await bookingsService.listMyBookings(authUser.userId, validationResult.data);

  return ok(
    "Bookings fetched successfully.",
    bookings.map((booking) => {
      return toBookingResponseDto(booking);
    })
  );
};