/**
 * Response envelope types matching the PetLink API contract.
 * Mirrors packages/shared ApiSuccess / ApiError shapes — defined
 * locally so apps/web has no server-side dependency on @petlink/shared.
 */

// ── Envelope ────────────────────────────────────────────────────────────────

export type ApiSuccess<TData> = {
  success: true;
  message: string;
  data: TData;
};

export type ApiError = {
  success: false;
  message: string;
  errorCode: string;
  details?: unknown;
};

export type ApiResponse<TData> = ApiSuccess<TData> | ApiError;

// ── auth API (apps/auth) ─────────────────────────────────────────────────────

export type UserRole = "OWNER" | "PROVIDER" | "ADMIN";

export type UserProfileDto = {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  city: string | null;
  createdAt: string;
  updatedAt: string;
};

// ── pets API (apps/pets) ─────────────────────────────────────────────────────

export type PetSex = "MALE" | "FEMALE";

export type PetDto = {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  sex: PetSex;
  description: string | null;
  isSterilized: boolean;
  isVaccinated: boolean;
  createdAt: string;
  updatedAt: string;
};

// ── marketplace API (apps/marketplace) ───────────────────────────────────────

export type ServiceType =
  | "WALKING"
  | "DAYCARE"
  | "BOARDING"
  | "TRAINING"
  | "GROOMING"
  | "PET_SITTING"
  | "OTHER";

export type ServiceDto = {
  id: string;
  providerId: string;
  type: ServiceType;
  title: string;
  description: string;
  price: number;
  location: string;
  availabilityNotes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type BookingDto = {
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
