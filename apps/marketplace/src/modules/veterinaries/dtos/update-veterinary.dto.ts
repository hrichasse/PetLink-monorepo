import type { VeterinarySpecialty } from "@prisma/client";

export type UpdateVeterinaryDto = {
  name?: string | undefined;
  description?: string | null | undefined;
  phone?: string | null | undefined;
  email?: string | null | undefined;
  website?: string | null | undefined;
  address?: string | undefined;
  city?: string | undefined;
  lat?: number | null | undefined;
  lng?: number | null | undefined;
  specialties?: VeterinarySpecialty[] | undefined;
  imageUrl?: string | null | undefined;
  isPartner?: boolean | undefined;
  isActive?: boolean | undefined;
  operatingHours?: Record<string, unknown> | null | undefined;
};
