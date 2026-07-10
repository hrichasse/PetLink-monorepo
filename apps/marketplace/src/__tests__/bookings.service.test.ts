import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { AppError, NotFoundError, HTTP_STATUS } from "@petlink/shared";

// Mock the repository and the cross-domain pets client before importing the service.
jest.mock("../modules/bookings/repositories", () => ({
  bookingsRepository: {
    findServiceById: jest.fn(),
    findById: jest.fn(),
    findManyForUser: jest.fn(),
    create: jest.fn(),
    updateStatusById: jest.fn(),
  },
}));

jest.mock("../lib/internal/pets-api.client", () => ({
  petsApiClient: {
    getPetById: jest.fn(),
  },
}));

import { bookingsService } from "../modules/bookings/services/bookings.service";
import { bookingsRepository } from "../modules/bookings/repositories";
import { petsApiClient } from "../lib/internal/pets-api.client";

const mockRepo = bookingsRepository as jest.Mocked<typeof bookingsRepository>;
const mockPetsClient = petsApiClient as jest.Mocked<typeof petsApiClient>;

const OWNER_ID = "owner-uuid";
const PROVIDER_ID = "provider-uuid";
const STRANGER_ID = "stranger-uuid";
const BOOKING_ID = "booking-uuid";
const SERVICE_ID = "service-uuid";
const AUTH_HEADER = "Bearer token";

const futureDate = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

const makeBooking = (overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    id: BOOKING_ID,
    ownerId: OWNER_ID,
    providerId: PROVIDER_ID,
    serviceId: SERVICE_ID,
    petId: "pet-uuid",
    status: "PENDING",
    bookingDate: futureDate(),
    ...overrides,
  }) as never;

const makeService = (overrides: Partial<Record<string, unknown>> = {}) =>
  ({ id: SERVICE_ID, providerId: PROVIDER_ID, isActive: true, ...overrides }) as never;

const validPayload = () => ({ petId: "pet-uuid", serviceId: SERVICE_ID, bookingDate: futureDate() }) as never;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("bookingsService.createBooking()", () => {
  it("rejects a booking date that is not in the future", async () => {
    const payload = { petId: "pet-uuid", serviceId: SERVICE_ID, bookingDate: new Date(Date.now() - 1000) } as never;

    await expect(bookingsService.createBooking(OWNER_ID, AUTH_HEADER, payload)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    });
    expect(mockPetsClient.getPetById).not.toHaveBeenCalled();
  });

  it("throws NotFound when the service does not exist", async () => {
    mockPetsClient.getPetById.mockResolvedValueOnce(undefined as never);
    mockRepo.findServiceById.mockResolvedValueOnce(null as never);

    await expect(bookingsService.createBooking(OWNER_ID, AUTH_HEADER, validPayload())).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  it("rejects booking an inactive service", async () => {
    mockPetsClient.getPetById.mockResolvedValueOnce(undefined as never);
    mockRepo.findServiceById.mockResolvedValueOnce(makeService({ isActive: false }));

    await expect(bookingsService.createBooking(OWNER_ID, AUTH_HEADER, validPayload())).rejects.toMatchObject({
      statusCode: HTTP_STATUS.CONFLICT,
    });
  });

  it("prevents a provider from booking their own service", async () => {
    mockPetsClient.getPetById.mockResolvedValueOnce(undefined as never);
    mockRepo.findServiceById.mockResolvedValueOnce(makeService({ providerId: OWNER_ID }));

    await expect(bookingsService.createBooking(OWNER_ID, AUTH_HEADER, validPayload())).rejects.toMatchObject({
      statusCode: HTTP_STATUS.CONFLICT,
    });
  });

  it("creates the booking against the service provider on the happy path", async () => {
    mockPetsClient.getPetById.mockResolvedValueOnce(undefined as never);
    mockRepo.findServiceById.mockResolvedValueOnce(makeService());
    mockRepo.create.mockResolvedValueOnce(makeBooking());

    await bookingsService.createBooking(OWNER_ID, AUTH_HEADER, validPayload());

    expect(mockPetsClient.getPetById).toHaveBeenCalledWith(AUTH_HEADER, "pet-uuid");
    expect(mockRepo.create).toHaveBeenCalledWith(OWNER_ID, PROVIDER_ID, expect.any(Object));
  });
});

describe("bookingsService.getBookingByIdForUser()", () => {
  it("throws NotFound when the booking is missing", async () => {
    mockRepo.findById.mockResolvedValueOnce(null as never);

    await expect(bookingsService.getBookingByIdForUser(OWNER_ID, BOOKING_ID)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("forbids access to a user who is neither owner nor provider", async () => {
    mockRepo.findById.mockResolvedValueOnce(makeBooking());

    await expect(bookingsService.getBookingByIdForUser(STRANGER_ID, BOOKING_ID)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.FORBIDDEN,
    });
  });

  it("returns the booking for a participant", async () => {
    const booking = makeBooking();
    mockRepo.findById.mockResolvedValueOnce(booking);

    await expect(bookingsService.getBookingByIdForUser(PROVIDER_ID, BOOKING_ID)).resolves.toBe(booking);
  });
});

describe("bookingsService.updateBookingStatusForUser()", () => {
  it("rejects setting the status it already has", async () => {
    mockRepo.findById.mockResolvedValueOnce(makeBooking({ status: "PENDING" }));

    await expect(
      bookingsService.updateBookingStatusForUser(PROVIDER_ID, BOOKING_ID, { status: "PENDING" } as never)
    ).rejects.toMatchObject({ statusCode: HTTP_STATUS.CONFLICT });
  });

  it("only lets the owner cancel (not confirm)", async () => {
    mockRepo.findById.mockResolvedValueOnce(makeBooking({ status: "PENDING" }));

    await expect(
      bookingsService.updateBookingStatusForUser(OWNER_ID, BOOKING_ID, { status: "CONFIRMED" } as never)
    ).rejects.toMatchObject({ statusCode: HTTP_STATUS.FORBIDDEN });
  });

  it("rejects an invalid state transition (COMPLETED is terminal)", async () => {
    mockRepo.findById.mockResolvedValueOnce(makeBooking({ status: "COMPLETED" }));

    await expect(
      bookingsService.updateBookingStatusForUser(PROVIDER_ID, BOOKING_ID, { status: "CONFIRMED" } as never)
    ).rejects.toMatchObject({ statusCode: HTTP_STATUS.CONFLICT });
  });

  it("lets the provider confirm a pending booking", async () => {
    mockRepo.findById.mockResolvedValueOnce(makeBooking({ status: "PENDING" }));
    mockRepo.updateStatusById.mockResolvedValueOnce(makeBooking({ status: "CONFIRMED" }));

    await bookingsService.updateBookingStatusForUser(PROVIDER_ID, BOOKING_ID, { status: "CONFIRMED" } as never);

    expect(mockRepo.updateStatusById).toHaveBeenCalledWith(BOOKING_ID, "CONFIRMED", undefined);
  });
});

describe("bookingsService.cancelBookingForUser()", () => {
  it("rejects cancelling an already-cancelled booking", async () => {
    mockRepo.findById.mockResolvedValueOnce(makeBooking({ status: "CANCELLED" }));

    await expect(bookingsService.cancelBookingForUser(OWNER_ID, BOOKING_ID)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.CONFLICT,
    });
  });

  it("rejects cancelling a completed booking", async () => {
    mockRepo.findById.mockResolvedValueOnce(makeBooking({ status: "COMPLETED" }));

    await expect(bookingsService.cancelBookingForUser(OWNER_ID, BOOKING_ID)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.CONFLICT,
    });
  });

  it("cancels an active booking", async () => {
    mockRepo.findById.mockResolvedValueOnce(makeBooking({ status: "CONFIRMED" }));
    mockRepo.updateStatusById.mockResolvedValueOnce(makeBooking({ status: "CANCELLED" }));

    await bookingsService.cancelBookingForUser(OWNER_ID, BOOKING_ID);

    expect(mockRepo.updateStatusById).toHaveBeenCalledWith(BOOKING_ID, "CANCELLED");
  });
});
