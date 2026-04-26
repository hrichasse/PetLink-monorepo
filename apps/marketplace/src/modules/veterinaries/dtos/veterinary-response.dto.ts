import type { VeterinarySpecialty } from "@prisma/client";

import type { VeterinaryModel } from "@/modules/veterinaries/types";

export type VeterinaryResponseDto = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string;
  city: string;
  lat: number | null;
  lng: number | null;
  specialties: VeterinarySpecialty[];
  imageUrl: string | null;
  isPartner: boolean;
  isActive: boolean;
  operatingHours: unknown;
  createdAt: string;
  updatedAt: string;
};

export const toVeterinaryResponseDto = (vet: VeterinaryModel): VeterinaryResponseDto => {
  return {
    id: vet.id,
    name: vet.name,
    description: vet.description,
    phone: vet.phone,
    email: vet.email,
    website: vet.website,
    address: vet.address,
    city: vet.city,
    lat: vet.lat ? Number(vet.lat) : null,
    lng: vet.lng ? Number(vet.lng) : null,
    specialties: vet.specialties,
    imageUrl: vet.imageUrl,
    isPartner: vet.isPartner,
    isActive: vet.isActive,
    operatingHours: vet.operatingHours,
    createdAt: vet.createdAt.toISOString(),
    updatedAt: vet.updatedAt.toISOString()
  };
};
