import { apiFetch } from "./api-client";
import type { BookingDto, BookingStatus, ServiceDto, ServiceType } from "./types";

const BASE = process.env["NEXT_PUBLIC_MARKETPLACE_API_URL"] ?? "http://localhost:3003/api/v1";

// ── Services ─────────────────────────────────────────────────────────────────

type ListServicesParams = {
  type?: ServiceType;
  location?: string;
  isActive?: boolean;
};

type CreateServicePayload = {
  type: ServiceType;
  title: string;
  description: string;
  price: number;
  location: string;
  availabilityNotes?: string;
};

// ── Bookings ──────────────────────────────────────────────────────────────────

type CreateBookingPayload = {
  petId: string;
  serviceId: string;
  bookingDate: string;
  durationHours?: number;
  notes?: string;
};

type UpdateBookingStatusPayload = {
  status: BookingStatus;
  notes?: string;
};

export const marketplaceApi = {
  // Services

  /** GET /services — Lists services with optional type/location/isActive filters. */
  listServices: (token: string, params: ListServicesParams = {}): Promise<ServiceDto[]> => {
    const qs = new URLSearchParams();
    if (params.type !== undefined) qs.set("type", params.type);
    if (params.location !== undefined) qs.set("location", params.location);
    if (params.isActive !== undefined) qs.set("isActive", String(params.isActive));
    const query = qs.toString();
    return apiFetch<ServiceDto[]>(`${BASE}/services${query.length > 0 ? `?${query}` : ""}`, { token });
  },

  /** GET /services/:id — Returns a single service. */
  getServiceById: (token: string, id: string): Promise<ServiceDto> =>
    apiFetch<ServiceDto>(`${BASE}/services/${id}`, { token }),

  /** POST /services — Creates a new service (PROVIDER role required). */
  createService: (token: string, payload: CreateServicePayload): Promise<ServiceDto> =>
    apiFetch<ServiceDto>(`${BASE}/services`, { token, method: "POST", body: payload }),

  // Bookings

  /** GET /bookings — Lists bookings for the authenticated user. */
  listMyBookings: (token: string, role?: "owner" | "provider"): Promise<BookingDto[]> => {
    const qs = role !== undefined ? `?role=${role}` : "";
    return apiFetch<BookingDto[]>(`${BASE}/bookings${qs}`, { token });
  },

  /** GET /bookings/:id — Returns a single booking the user is participant of. */
  getBookingById: (token: string, id: string): Promise<BookingDto> =>
    apiFetch<BookingDto>(`${BASE}/bookings/${id}`, { token }),

  /** POST /bookings — Creates a booking for one of the user's pets. */
  createBooking: (token: string, payload: CreateBookingPayload): Promise<BookingDto> =>
    apiFetch<BookingDto>(`${BASE}/bookings`, { token, method: "POST", body: payload }),

  /** PATCH /bookings/:id/status — Updates booking status (cancel, confirm, complete). */
  updateBookingStatus: (
    token: string,
    id: string,
    payload: UpdateBookingStatusPayload
  ): Promise<BookingDto> =>
    apiFetch<BookingDto>(`${BASE}/bookings/${id}/status`, { token, method: "PATCH", body: payload })
};
