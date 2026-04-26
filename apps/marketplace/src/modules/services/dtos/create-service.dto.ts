import type { ServiceType } from "@prisma/client";

export type CreateServiceDto = {
  type: ServiceType;
  title: string;
  description: string;
  price: number;
  location: string;
  availabilityNotes?: string | null | undefined;
  isActive?: boolean | undefined;
};