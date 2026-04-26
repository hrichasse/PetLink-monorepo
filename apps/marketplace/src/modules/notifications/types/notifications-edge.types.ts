import type { NotificationChannel } from "@prisma/client";

export type NotificationEventType =
  | "BOOKING_CREATED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_COMPLETED"
  | "HEALTH_REMINDER"
  | "SYSTEM";

export type SendNotificationRequest = {
  recipientId: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  eventType: NotificationEventType;
  payload?: Record<string, unknown> | undefined;
};

export type SendNotificationResponse = {
  queued: boolean;
  notificationId?: string | undefined;
  providerMessageId?: string | undefined;
  status: "QUEUED" | "SENT" | "FAILED";
};

export type SendHealthReminderRequest = {
  recipientId: string;
  petId: string;
  healthRecordId: string;
  dueDate: string;
  title?: string | undefined;
  message?: string | undefined;
};