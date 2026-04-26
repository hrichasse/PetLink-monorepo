import type { PetSex } from "@prisma/client";

export type CreatePetDto = {
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  sex: PetSex;
  description?: string | null | undefined;
  isSterilized: boolean;
  isVaccinated: boolean;
};