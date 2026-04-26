import { NextRequest } from "next/server";

import { cancelBookingController, getBookingByIdController } from "@/modules/bookings/controllers";
import { withErrorHandler } from "@petlink/shared";

type BookingIdRouteParams = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, context: BookingIdRouteParams) {
  return withErrorHandler(() => getBookingByIdController(request, context));
}

export async function DELETE(request: NextRequest, context: BookingIdRouteParams) {
  // DELETE performs a logical cancellation by setting status to CANCELLED.
  return withErrorHandler(() => cancelBookingController(request, context));
}