import { NextRequest } from "next/server";

import { withErrorHandler, getAuthContext, ok } from "@petlink/shared";
import { notificationsEdgeService } from "@/modules/notifications/services";
import type { SendNotificationRequest } from "@/modules/notifications/types";

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const auth = await getAuthContext(request);
    const body = (await request.json()) as Omit<SendNotificationRequest, "recipientId">;
    const data = await notificationsEdgeService.sendNotification({
      recipientId: auth.userId,
      channel: body.channel,
      title: body.title,
      message: body.message,
      eventType: body.eventType,
      payload: body.payload
    });
    return ok("Notification sent.", data);
  });
}
