import { NextRequest } from "next/server";

import { updateBookingStatusController } from "@/modules/bookings/controllers";
import { withErrorHandler } from "@petlink/shared";

type BookingIdRouteParams = {
  params: {
    id: string;
  };
};

export async function PATCH(request: NextRequest, context: BookingIdRouteParams) {
  return withErrorHandler(() => updateBookingStatusController(request, context));
}