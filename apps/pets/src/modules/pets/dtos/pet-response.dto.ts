import type { PetSex } from "@prisma/client";

import type { PetModel } from "@/modules/pets/types";

export type PetResponseDto = {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  sex: PetSex;
  imageUrl: string | null;
  description: string | null;
  isSterilized: boolean;
  isVaccinated: boolean;
  createdAt: string;
  updatedAt: string;
};

export const toPetResponseDto = (pet: PetModel): PetResponseDto => {
  return {
    id: pet.id,
    ownerId: pet.ownerId,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    weight: Number(pet.weight),
    sex: pet.sex,
    imageUrl: pet.images?.[0]?.imageUrl ?? null,
    description: pet.description,
    isSterilized: pet.isSterilized,
    isVaccinated: pet.isVaccinated,
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString()
  };
};