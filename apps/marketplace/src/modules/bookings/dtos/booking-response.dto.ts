import type { BookingStatus } from "@prisma/client";

import type { BookingModel } from "@/modules/bookings/types";

export type BookingResponseDto = {
  id: string;
  petId: string;
  serviceId: string;
  ownerId: string;
  providerId: string;
  bookingDate: string;
  durationHours: number | null;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export const toBookingResponseDto = (booking: BookingModel): BookingResponseDto => {
  return {
    id: booking.id,
    petId: booking.petId,
    serviceId: booking.serviceId,
    ownerId: booking.ownerId,
    providerId: booking.providerId,
    bookingDate: booking.bookingDate.toISOString(),
    durationHours: booking.durationHours,
    status: booking.status,
    notes: booking.notes,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString()
  };
};