import type { BookingStatus } from "@prisma/client";

export type UpdateBookingStatusDto = {
  status: BookingStatus;
  notes?: string | null | undefined;
};