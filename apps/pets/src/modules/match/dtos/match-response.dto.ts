import type { PetSex } from "@prisma/client";

import type { CompatiblePet, MatchPreferenceModel, PetModel } from "@/modules/match/types";

export type MatchPreferenceResponseDto = {
  id: string;
  petId: string;
  preferredBreed: string | null;
  preferredSex: PetSex | null;
  minAge: number | null;
  maxAge: number | null;
  preferredLocation: string | null;
  healthRequirements: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MatchPetResponseDto = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  sex: PetSex;
  description: string | null;
  isSterilized: boolean;
  isVaccinated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CompatiblePetResponseDto = {
  compatibilityScore: number;
  reasons: string[];
  pet: MatchPetResponseDto;
};

const toMatchPetResponseDto = (pet: PetModel): MatchPetResponseDto => {
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    weight: Number(pet.weight),
    sex: pet.sex,
    description: pet.description,
    isSterilized: pet.isSterilized,
    isVaccinated: pet.isVaccinated,
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString()
  };
};

export const toCompatiblePetResponseDto = (candidate: CompatiblePet): CompatiblePetResponseDto => {
  return {
    compatibilityScore: candidate.compatibilityScore,
    reasons: candidate.reasons,
    pet: toMatchPetResponseDto(candidate.pet)
  };
};

export const toMatchPreferenceResponseDto = (preference: MatchPreferenceModel): MatchPreferenceResponseDto => {
  return {
    id: preference.id,
    petId: preference.petId,
    preferredBreed: preference.preferredBreed,
    preferredSex: preference.preferredSex,
    minAge: preference.minAge,
    maxAge: preference.maxAge,
    preferredLocation: preference.preferredLocation,
    healthRequirements: preference.healthRequirements,
    createdAt: preference.createdAt.toISOString(),
    updatedAt: preference.updatedAt.toISOString()
  };
};