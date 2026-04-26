import { invokeEdgeFunction } from "@petlink/shared";
import type {
  SendHealthReminderRequest,
  SendNotificationRequest,
  SendNotificationResponse
} from "@/modules/notifications/types";

const NOTIFICATIONS_FUNCTION_NAME = "notifications";

export const notificationsEdgeService = {
  sendNotification: (payload: SendNotificationRequest): Promise<SendNotificationResponse> => {
    return invokeEdgeFunction<SendNotificationRequest, SendNotificationResponse>({
      functionName: NOTIFICATIONS_FUNCTION_NAME,
      payload
    });
  },

  sendHealthReminder: (payload: SendHealthReminderRequest): Promise<SendNotificationResponse> => {
    const notificationPayload: SendNotificationRequest = {
      recipientId: payload.recipientId,
      channel: "IN_APP",
      title: payload.title ?? "Health reminder",
      message: payload.message ?? "Your pet has an upcoming health record due date.",
      eventType: "HEALTH_REMINDER",
      payload: {
        petId: payload.petId,
        healthRecordId: payload.healthRecordId,
        dueDate: payload.dueDate
      }
    };

    return notificationsEdgeService.sendNotification(notificationPayload);
  }
};