import type { ServiceType } from "@prisma/client";

export type UpdateServiceDto = {
  type?: ServiceType | undefined;
  title?: string | undefined;
  description?: string | undefined;
  price?: number | undefined;
  location?: string | undefined;
  availabilityNotes?: string | null | undefined;
  isActive?: boolean | undefined;
};