import type { VeterinarySpecialty } from "@prisma/client";

export type CreateVeterinaryDto = {
  name: string;
  description?: string | null | undefined;
  phone?: string | null | undefined;
  email?: string | null | undefined;
  website?: string | null | undefined;
  address: string;
  city: string;
  lat?: number | null | undefined;
  lng?: number | null | undefined;
  specialties?: VeterinarySpecialty[] | undefined;
  imageUrl?: string | null | undefined;
  isPartner?: boolean | undefined;
  isActive?: boolean | undefined;
  operatingHours?: Record<string, unknown> | null | undefined;
};
