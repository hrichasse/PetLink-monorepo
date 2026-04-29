import type { BookingStatus, Prisma, Service } from "@prisma/client";

import { prisma } from "@petlink/database";
import type { CreateBookingDto, ListBookingsQueryDto } from "@/modules/bookings/dtos";
import type { BookingModel } from "@/modules/bookings/types";

const toCreateInput = (authUserId: string, providerId: string, payload: CreateBookingDto): Prisma.BookingCreateInput => {
  const data: Prisma.BookingCreateInput = {
    pet: {
      connect: {
        id: payload.petId
      }
    },
    service: {
      connect: {
        id: payload.serviceId
      }
    },
    owner: {
      connect: {
        userId: authUserId
      }
    },
    provider: {
      connect: {
        userId: providerId
      }
    },
    bookingDate: payload.bookingDate,
    status: "PENDING"
  };

  if (payload.durationHours !== undefined) {
    data.durationHours = payload.durationHours;
  }

  if (payload.notes !== undefined) {
    data.notes = payload.notes;
  }

  return data;
};

const toWhereForUser = (authUserId: string, query: ListBookingsQueryDto): Prisma.BookingWhereInput => {
  if (query.role === "owner") {
    return { ownerId: authUserId };
  }

  if (query.role === "provider") {
    return { providerId: authUserId };
  }

  return {
    OR: [{ ownerId: authUserId }, { providerId: authUserId }]
  };
};

export const bookingsRepository = {
  findById: (id: string): Promise<BookingModel | null> => {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        pet: true
      }
    });
  },

  findServiceById: (id: string): Promise<Service | null> => {
    return prisma.service.findUnique({
      where: { id }
    });
  },

  create: (authUserId: string, providerId: string, payload: CreateBookingDto): Promise<BookingModel> => {
    return prisma.booking.create({
      data: toCreateInput(authUserId, providerId, payload),
      include: {
        service: true,
        pet: true
      }
    });
  },

  findManyForUser: (authUserId: string, query: ListBookingsQueryDto): Promise<BookingModel[]> => {
    return prisma.booking.findMany({
      where: toWhereForUser(authUserId, query),
      include: {
        service: true,
        pet: true
      },
      orderBy: { createdAt: "desc" }
    });
  },

  updateStatusById: (id: string, status: BookingStatus, notes?: string | null): Promise<BookingModel> => {
    const data: Prisma.BookingUpdateInput = {
      status
    };

    if (notes !== undefined) {
      data.notes = notes;
    }

    return prisma.booking.update({
      where: { id },
      data,
      include: {
        service: true,
        pet: true
      }
    });
  }
};