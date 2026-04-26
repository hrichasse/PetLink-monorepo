import { NextRequest, NextResponse } from "next/server";

import { createBookingSchema } from "@/modules/bookings/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { created } from "@petlink/shared";
import { toBookingResponseDto } from "@/modules/bookings/dtos";
import { bookingsService } from "@/modules/bookings/services";

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

export const createBookingController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  // requireAuth validates the header above; this cast is safe.
  const authorizationHeader = request.headers.get("authorization") as string;
  const body = await parseBody(request);
  const validationResult = createBookingSchema.safeParse(body);

  if (!validationResult.success) {
    throw new AppError("Invalid create booking payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const booking = await bookingsService.createBooking(authUser.userId, authorizationHeader, validationResult.data);

  return created("Booking created successfully.", toBookingResponseDto(booking));
};