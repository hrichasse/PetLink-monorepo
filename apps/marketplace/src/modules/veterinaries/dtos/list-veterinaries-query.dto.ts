import type { VeterinarySpecialty } from "@prisma/client";

export type ListVeterinariesQueryDto = {
  city?: string | undefined;
  specialty?: VeterinarySpecialty | undefined;
  isPartner?: boolean | undefined;
  isActive?: boolean | undefined;
};
