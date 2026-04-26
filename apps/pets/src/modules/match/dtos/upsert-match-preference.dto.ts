import type { PetSex } from "@prisma/client";

export type UpsertMatchPreferenceDto = {
  petId: string;
  preferredBreed?: string | null | undefined;
  preferredSex?: PetSex | null | undefined;
  minAge?: number | null | undefined;
  maxAge?: number | null | undefined;
  preferredLocation?: string | null | undefined;
  healthRequirements?: string | null | undefined;
};