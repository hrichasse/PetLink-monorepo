import { BookingStatus } from "@prisma/client";

import type { CreateBookingDto, ListBookingsQueryDto, UpdateBookingStatusDto } from "@/modules/bookings/dtos";
import { bookingsRepository } from "@/modules/bookings/repositories";
import type { BookingModel } from "@/modules/bookings/types";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { NotFoundError } from "@petlink/shared";

const BOOKING_NOT_FOUND_MESSAGE = "Booking not found.";
const BOOKING_FORBIDDEN_MESSAGE = "You do not have access to this booking.";
const INVALID_BOOKING_STATUS_TRANSITION = "Invalid booking status transition.";

const assertBookingParticipant = (booking: BookingModel, authUserId: string): void => {
  if (booking.ownerId !== authUserId && booking.providerId !== authUserId) {
    throw new AppError(BOOKING_FORBIDDEN_MESSAGE, {
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: ERROR_CODES.FORBIDDEN
    });
  }
};

const assertTransitionAllowed = (currentStatus: BookingStatus, nextStatus: BookingStatus): void => {
  const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
    PENDING: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
    CONFIRMED: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    COMPLETED: [],
    CANCELLED: []
  };

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw new AppError(INVALID_BOOKING_STATUS_TRANSITION, {
      statusCode: HTTP_STATUS.CONFLICT,
      code: ERROR_CODES.CONFLICT,
      details: {
        currentStatus,
        nextStatus
      }
    });
  }
};

export const bookingsService = {
  createBooking: async (authUserId: string, payload: CreateBookingDto): Promise<BookingModel> => {
    if (payload.bookingDate.getTime() <= Date.now()) {
      throw new AppError("Booking date must be in the future.", {
        statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        code: ERROR_CODES.VALIDATION_ERROR
      });
    }

    const pet = await bookingsRepository.findPetById(payload.petId);

    if (!pet) {
      throw new NotFoundError("Pet not found.");
    }

    if (pet.ownerId !== authUserId) {
      throw new AppError("Pet does not belong to authenticated user.", {
        statusCode: HTTP_STATUS.FORBIDDEN,
        code: ERROR_CODES.FORBIDDEN
      });
    }

    const service = await bookingsRepository.findServiceById(payload.serviceId);

    if (!service) {
      throw new NotFoundError("Service not found.");
    }

    if (!service.isActive) {
      throw new AppError("Service is not active.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    if (service.providerId === authUserId) {
      throw new AppError("You cannot book your own service.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    return bookingsRepository.create(authUserId, service.providerId, payload);
  },

  listMyBookings: (authUserId: string, query: ListBookingsQueryDto): Promise<BookingModel[]> => {
    return bookingsRepository.findManyForUser(authUserId, query);
  },

  getBookingByIdForUser: async (authUserId: string, bookingId: string): Promise<BookingModel> => {
    const booking = await bookingsRepository.findById(bookingId);

    if (!booking) {
      throw new NotFoundError(BOOKING_NOT_FOUND_MESSAGE);
    }

    assertBookingParticipant(booking, authUserId);

    return booking;
  },

  updateBookingStatusForUser: async (
    authUserId: string,
    bookingId: string,
    payload: UpdateBookingStatusDto
  ): Promise<BookingModel> => {
    const booking = await bookingsService.getBookingByIdForUser(authUserId, bookingId);

    if (booking.status === payload.status) {
      throw new AppError("Booking already has the requested status.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    if (authUserId === booking.ownerId && payload.status !== BookingStatus.CANCELLED) {
      throw new AppError("Owner can only cancel bookings.", {
        statusCode: HTTP_STATUS.FORBIDDEN,
        code: ERROR_CODES.FORBIDDEN
      });
    }

    assertTransitionAllowed(booking.status, payload.status);

    return bookingsRepository.updateStatusById(bookingId, payload.status, payload.notes);
  },

  cancelBookingForUser: async (authUserId: string, bookingId: string): Promise<BookingModel> => {
    const booking = await bookingsService.getBookingByIdForUser(authUserId, bookingId);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new AppError("Booking is already cancelled.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new AppError("Completed booking cannot be cancelled.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    return bookingsRepository.updateStatusById(bookingId, BookingStatus.CANCELLED);
  }
};