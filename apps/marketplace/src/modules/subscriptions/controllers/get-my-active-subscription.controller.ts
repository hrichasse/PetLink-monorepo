import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@petlink/shared";
import { toSubscriptionResponseDto } from "@/modules/subscriptions/dtos";
import { subscriptionsService } from "@/modules/subscriptions/services";
import { ok } from "@petlink/shared";

export const getMyActiveSubscriptionController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const subscription = await subscriptionsService.getMyActiveSubscription(authUser.userId);

  return ok("Active subscription fetched successfully.", toSubscriptionResponseDto(subscription));
};
