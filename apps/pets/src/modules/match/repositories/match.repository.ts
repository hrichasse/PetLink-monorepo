import type { MatchPreference, Pet, Prisma } from "@prisma/client";

import { prisma } from "@petlink/database";
import type { UpsertMatchPreferenceDto } from "@/modules/match/dtos";
import type { MatchPreferenceModel, PetModel } from "@/modules/match/types";

const toPreferenceData = (payload: UpsertMatchPreferenceDto): Prisma.MatchPreferenceUncheckedCreateInput => {
  return {
    petId: payload.petId,
    preferredBreed: payload.preferredBreed ?? null,
    preferredSex: payload.preferredSex ?? null,
    minAge: payload.minAge ?? null,
    maxAge: payload.maxAge ?? null,
    preferredLocation: payload.preferredLocation ?? null,
    healthRequirements: payload.healthRequirements ?? null
  };
};

const toPreferenceUpdateInput = (payload: UpsertMatchPreferenceDto): Prisma.MatchPreferenceUpdateInput => {
  const update: Prisma.MatchPreferenceUpdateInput = {};

  if (payload.preferredBreed !== undefined) {
    update.preferredBreed = payload.preferredBreed;
  }

  if (payload.preferredSex !== undefined) {
    update.preferredSex = payload.preferredSex;
  }

  if (payload.minAge !== undefined) {
    update.minAge = payload.minAge;
  }

  if (payload.maxAge !== undefined) {
    update.maxAge = payload.maxAge;
  }

  if (payload.preferredLocation !== undefined) {
    update.preferredLocation = payload.preferredLocation;
  }

  if (payload.healthRequirements !== undefined) {
    update.healthRequirements = payload.healthRequirements;
  }

  return update;
};

export const matchRepository = {
  findPetById: (id: string): Promise<Pet | null> => {
    return prisma.pet.findUnique({
      where: { id }
    });
  },

  findPreferenceByPetId: (petId: string): Promise<MatchPreference | null> => {
    return prisma.matchPreference.findUnique({
      where: { petId }
    });
  },

  upsertPreference: (payload: UpsertMatchPreferenceDto): Promise<MatchPreferenceModel> => {
    const data = toPreferenceData(payload);
    const update = toPreferenceUpdateInput(payload);

    return prisma.matchPreference.upsert({
      where: { petId: payload.petId },
      create: data,
      update
    });
  },

  findCandidatePets: (where: Prisma.PetWhereInput, take: number): Promise<PetModel[]> => {
    return prisma.pet.findMany({
      where,
      take,
      orderBy: { createdAt: "desc" }
    });
  }
};