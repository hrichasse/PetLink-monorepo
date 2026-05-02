import { apiRequest, asQuery, setAccessToken, setRefreshToken } from "@/lib/api";
import type { Announcement, Booking, BookingStatus, MatchCompatiblePet, MatchPreference, Payment, PaymentCheckout, PaymentProvider, Pet, PetSex, Profile, Service, Subscription, SubscriptionPlanCode, Vet } from "@/lib/petlink-data";

const PETLINK_AUTH_URL = "https://nkwqzgbnzzitcnuboyto.supabase.co/auth/v1";
const PETLINK_AUTH_ANON_KEY = process.env.NEXT_PUBLIC_PETLINK_AUTH_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rd3F6Z2JuenppdGNudWJveXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTg5NTQsImV4cCI6MjA4OTI5NDk1NH0.Vc8s2lDTa8ygKzEi184WU4ZVCvg7L2b46KlK8I3YJOM";

type PetLinkAuthSession = {
  access_token: string;
  refresh_token: string;
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
};

async function authSessionRequest(path: string, payload: Record<string, unknown>) {
  if (!PETLINK_AUTH_ANON_KEY) throw new Error("Falta configurar VITE_PETLINK_AUTH_ANON_KEY para el auth real de PetLink");
  const response = await fetch(`${PETLINK_AUTH_URL}${path}`, {
    method: "POST",
    headers: { apikey: PETLINK_AUTH_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) throw new Error(data?.message ?? data?.error_description ?? "No se pudo autenticar en PetLink");
  setAccessToken(data.access_token);
  if (data.refresh_token) setRefreshToken(data.refresh_token);
  return data as PetLinkAuthSession;
}

export const authApi = {
  login: (payload: { email: string; password: string }) => authSessionRequest("/token?grant_type=password", payload),
  signup: (payload: { email: string; password: string; fullName: string; role: "OWNER" | "PROVIDER" }) =>
    authSessionRequest("/signup", { email: payload.email, password: payload.password, data: { full_name: payload.fullName, role: payload.role } }),
  provisionUser: (payload: { fullName: string; phone?: string | null; city?: string | null; location?: string | null }) =>
    apiRequest<Profile>("auth", "/users", { method: "POST", body: JSON.stringify(payload) }),
  getMe: () => apiRequest<Profile>("auth", "/users/me"),
  updateMe: (payload: Partial<Pick<Profile, "fullName" | "phone" | "city" | "location">>) =>
    apiRequest<Profile>("auth", "/users/me", { method: "PATCH", body: JSON.stringify(payload) }),
};

export type CreatePetInput = {
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  sex: PetSex;
  description?: string | null;
  isSterilized?: boolean;
  isVaccinated?: boolean;
};

export const petsApi = {
  list: () => apiRequest<Pet[]>("pets", "/pets"),
  get: (id: string) => apiRequest<Pet>("pets", `/pets/${id}`),
  create: (payload: CreatePetInput) => apiRequest<Pet>("pets", "/pets", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<CreatePetInput>) => apiRequest<Pet>("pets", `/pets/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => apiRequest<unknown>("pets", `/pets/${id}`, { method: "DELETE" }),
  uploadImage: (petId: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiRequest<{ bucket: string; path: string; url: string; contentType: string; size: number; fileName: string }>("pets", `/media/pets/${petId}`, { method: "POST", body });
  },
  match: {
    findCompatible: (filters: { petId: string; limit?: number }) =>
      apiRequest<MatchCompatiblePet[]>("pets", `/match${asQuery(filters)}`),
    savePreferences: (payload: {
      petId: string;
      preferredBreed?: string | null;
      preferredSex?: "MALE" | "FEMALE" | null;
      minAge?: number | null;
      maxAge?: number | null;
      preferredLocation?: string | null;
      healthRequirements?: string | null;
    }) => apiRequest<MatchPreference>("pets", "/match/preferences", { method: "POST", body: JSON.stringify(payload) }),
  },
};

export type ServiceInput = Pick<Service, "type" | "title" | "description" | "price" | "location"> & {
  availabilityNotes?: string | null;
  isActive?: boolean;
};

export const marketplaceApi = {
  services: {
    list: (filters: { type?: string; location?: string; providerId?: string; isActive?: boolean } = {}) =>
      apiRequest<Service[]>("marketplace", `/services${asQuery(filters)}`),
    get: (id: string) => apiRequest<Service>("marketplace", `/services/${id}`),
    create: (payload: ServiceInput) => apiRequest<Service>("marketplace", "/services", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, payload: Partial<ServiceInput>) => apiRequest<Service>("marketplace", `/services/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  },
  bookings: {
    list: (role: "owner" | "provider") => apiRequest<Booking[]>("marketplace", `/bookings?role=${role}`),
    get: (id: string) => apiRequest<Booking>("marketplace", `/bookings/${id}`),
    create: (payload: { petId: string; serviceId: string; bookingDate: string; durationHours?: number; notes?: string | null }) =>
      apiRequest<Booking>("marketplace", "/bookings", { method: "POST", body: JSON.stringify(payload) }),
    updateStatus: (id: string, payload: { status: Uppercase<BookingStatus>; notes?: string | null }) =>
      apiRequest<Booking>("marketplace", `/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) }),
    cancel: (id: string) => apiRequest<unknown>("marketplace", `/bookings/${id}`, { method: "DELETE" }),
  },
  vets: {
    list: (filters: { city?: string; specialty?: string; isPartner?: boolean; isActive?: boolean } = {}) =>
      apiRequest<Vet[]>("marketplace", `/veterinaries${asQuery(filters)}`),
    get: (id: string) => apiRequest<Vet>("marketplace", `/veterinaries/${id}`),
      create: (payload: { name: string; address: string; city: string; phone?: string | null; description?: string | null; specialties?: string[]; isActive?: boolean }) =>
        apiRequest<Vet>("marketplace", "/veterinaries", { method: "POST", body: JSON.stringify(payload) }),
    },
  announcements: {
    list: (filters: { type?: string; city?: string; authorId?: string; isActive?: boolean } = {}) =>
      apiRequest<Announcement[]>("pets", `/announcements${asQuery(filters)}`),
    get: (id: string) => apiRequest<Announcement>("pets", `/announcements/${id}`),
    create: (payload: Partial<Announcement> & Pick<Announcement, "type" | "title" | "description">) =>
      apiRequest<Announcement>("pets", "/announcements", { method: "POST", body: JSON.stringify(payload) }),
  },
  notifications: {
    create: (payload: { channel: "EMAIL" | "PUSH" | "IN_APP" | "SMS"; title: string; message: string; eventType: string; payload?: Record<string, unknown> }) =>
      apiRequest<{ queued: boolean; notificationId?: string; providerMessageId?: string; status: "QUEUED" | "SENT" | "FAILED" }>("marketplace", "/notifications", { method: "POST", body: JSON.stringify(payload) }),
  },
  subscriptions: {
    getMyActive: () => apiRequest<Subscription | null>("marketplace", "/subscriptions/me"),
    create: (payload: { planCode: SubscriptionPlanCode; provider?: PaymentProvider; autoRenew?: boolean }) =>
      apiRequest<Subscription>("marketplace", "/subscriptions", { method: "POST", body: JSON.stringify(payload) }),
    cancel: (id: string) => apiRequest<Subscription>("marketplace", `/subscriptions/${id}/cancel`, { method: "PATCH" }),
  },
  payments: {
    checkout: (payload: { planCode: SubscriptionPlanCode; provider: PaymentProvider; subscriptionId?: string; autoRenew?: boolean }) =>
      apiRequest<PaymentCheckout>("marketplace", "/payments/checkout", { method: "POST", body: JSON.stringify(payload) }),
    confirm: (id: string, payload: { status: "APPROVED" | "REJECTED" | "CANCELLED" | "FAILED"; providerPaymentId?: string | null; providerReference?: string | null; paymentMethod?: string | null; metadata?: Record<string, unknown> }) =>
      apiRequest<Payment>("marketplace", `/payments/${id}/confirm`, { method: "POST", body: JSON.stringify(payload) }),
    my: () => apiRequest<Payment[]>("marketplace", "/payments/my"),
  }
};
