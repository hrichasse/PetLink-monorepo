export type CreateBookingDto = {
  petId: string;
  serviceId: string;
  bookingDate: Date;
  durationHours?: number | undefined;
  notes?: string | null | undefined;
};