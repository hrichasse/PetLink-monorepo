import { NextRequest, NextResponse } from "next/server";

import { bookingIdParamsSchema, updateBookingStatusSchema } from "@/modules/bookings/validators";
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

export const updateBookingStatusController = async (
  request: NextRequest,
  context: BookingIdRouteParams
): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const paramsValidation = bookingIdParamsSchema.safeParse(context.params);

  if (!paramsValidation.success) {
    throw new AppError("Invalid booking id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: paramsValidation.error.flatten()
    });
  }

  const body = await parseBody(request);
  const bodyValidation = updateBookingStatusSchema.safeParse(body);

  if (!bodyValidation.success) {
    throw new AppError("Invalid update booking status payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: bodyValidation.error.flatten()
    });
  }

  const booking = await bookingsService.updateBookingStatusForUser(
    authUser.userId,
    paramsValidation.data.id,
    bodyValidation.data
  );

  return ok("Booking status updated successfully.", toBookingResponseDto(booking));
};