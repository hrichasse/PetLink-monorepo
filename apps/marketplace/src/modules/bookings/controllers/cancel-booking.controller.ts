import { NextRequest, NextResponse } from "next/server";

import { bookingIdParamsSchema } from "@/modules/bookings/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";
import { toBookingResponseDto } from "@/modules/bookings/dtos";
import { bookingsService } from "@/modules/bookings/services";

type BookingIdRouteParams = {
  params: {
    id: string;
  };
};

export const cancelBookingController = async (request: NextRequest, context: BookingIdRouteParams): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const paramsValidation = bookingIdParamsSchema.safeParse(context.params);

  if (!paramsValidation.success) {
    throw new AppError("Invalid booking id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: paramsValidation.error.flatten()
    });
  }

  const booking = await bookingsService.cancelBookingForUser(authUser.userId, paramsValidation.data.id);

  return ok("Booking cancelled successfully.", toBookingResponseDto(booking));
};