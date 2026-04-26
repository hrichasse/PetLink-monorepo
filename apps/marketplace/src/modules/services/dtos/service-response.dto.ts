import type { ServiceType } from "@prisma/client";

import type { ServiceModel } from "@/modules/services/types";

export type ServiceResponseDto = {
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

export const toServiceResponseDto = (service: ServiceModel): ServiceResponseDto => {
  return {
    id: service.id,
    providerId: service.providerId,
    type: service.type,
    title: service.title,
    description: service.description,
    price: Number(service.price),
    location: service.location,
    availabilityNotes: service.availabilityNotes,
    isActive: service.isActive,
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString()
  };
};