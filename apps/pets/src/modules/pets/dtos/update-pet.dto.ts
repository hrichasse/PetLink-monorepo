import type { PetSex } from "@prisma/client";

export type UpdatePetDto = {
  name?: string | undefined;
  species?: string | undefined;
  breed?: string | undefined;
  age?: number | undefined;
  weight?: number | undefined;
  sex?: PetSex | undefined;
  description?: string | null | undefined;
  isSterilized?: boolean | undefined;
  isVaccinated?: boolean | undefined;
};