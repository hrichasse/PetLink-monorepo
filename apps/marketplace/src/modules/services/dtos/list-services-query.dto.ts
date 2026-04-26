import type { ServiceType } from "@prisma/client";

export type ListServicesQueryDto = {
  type?: ServiceType | undefined;
  location?: string | undefined;
  providerId?: string | undefined;
  isActive?: boolean | undefined;
};