import type { MatchPreference, Pet } from "@prisma/client";

export type MatchPreferenceModel = MatchPreference;
export type PetModel = Pet;

export type CompatiblePet = {
  pet: PetModel;
  compatibilityScore: number;
  reasons: string[];
};