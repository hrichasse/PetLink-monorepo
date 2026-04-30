export type Role = "OWNER" | "PROVIDER";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type PetSex = "MALE" | "FEMALE";

export type Profile = {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  city: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Pet = {
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
  imageUrl?: string | null;
  image_url?: string | null;
  images?: Array<{ imageUrl: string; createdAt: string }>;
  notes?: string | null;
};

export type MatchPreference = {
  id: string;
  petId: string;
  preferredBreed: string | null;
  preferredSex: PetSex | null;
  minAge: number | null;
  maxAge: number | null;
  preferredLocation: string | null;
  healthRequirements: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MatchCompatiblePet = {
  compatibilityScore: number;
  reasons: string[];
  pet: Pick<Pet, "id" | "name" | "species" | "breed" | "age" | "weight" | "sex" | "description" | "isSterilized" | "isVaccinated" | "createdAt" | "updatedAt">;
};

export type SubscriptionPlanCode = "BASIC" | "PREMIUM" | "PROVIDER_PRO";
export type PaymentProvider = "MERCADOPAGO" | "TRANSBANK";
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";
export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "FAILED";

export type Subscription = {
  id: string;
  planCode: SubscriptionPlanCode;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  autoRenew: boolean;
  provider: PaymentProvider | null;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
  subscriptionId: string | null;
  provider: PaymentProvider;
  providerPaymentId: string | null;
  providerReference: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  description: string;
  paymentMethod: string | null;
  paidAt: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

export type PaymentCheckout = {
  payment: Payment;
  checkoutUrl: string | null;
  providerPaymentId: string | null;
  providerReference: string | null;
};

export type Service = {
  id: string;
  providerId: string;
  type: string;
  title: string;
  description: string;
  price: number;
  location: string;
  availabilityNotes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  providerName?: string;
  category?: string;
  city?: string;
  rating?: number;
  image?: string;
};

export type Booking = {
  id: string;
  petId: string;
  serviceId: string;
  ownerId: string;
  providerId: string;
  bookingDate: string;
  durationHours?: number | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | BookingStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  serviceTitle?: string;
  serviceLocation?: string;
  petName?: string;
  date?: string;
  total?: number;
};

export type Announcement = {
  id: string;
  authorId: string;
  type: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  location?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  petId?: string | null;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Vet = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  specialties: string[];
  imageUrl: string | null;
  isPartner: boolean;
  isActive: boolean;
  operatingHours: unknown;
  createdAt: string;
  updatedAt: string;
  openNow?: boolean;
  rating?: number;
};

export const statusCopy: Record<BookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

export function normalizeBookingStatus(status: Booking["status"]): BookingStatus {
  return String(status).toLowerCase() as BookingStatus;
}
