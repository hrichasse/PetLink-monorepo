import type { Prisma } from "@prisma/client";

import type { FindCompatiblePetsQueryDto, UpsertMatchPreferenceDto } from "@/modules/match/dtos";
import { matchRepository } from "@/modules/match/repositories";
import type { CompatiblePet, MatchPreferenceModel, PetModel } from "@/modules/match/types";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { NotFoundError } from "@petlink/shared";

const assertPetOwnership = async (authUserId: string, petId: string): Promise<PetModel> => {
  const pet = await matchRepository.findPetById(petId);

  if (!pet) {
    throw new NotFoundError("Pet not found.");
  }

  if (pet.ownerId !== authUserId) {
    throw new AppError("You do not have access to this pet.", {
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: ERROR_CODES.FORBIDDEN
    });
  }

  return pet;
};

const parseHealthRequirements = (healthRequirements: string | null | undefined): {
  requireVaccinated: boolean;
  requireSterilized: boolean;
} => {
  const normalized = (healthRequirements ?? "").toLowerCase();

  return {
    requireVaccinated: /vaccin|vacun/.test(normalized),
    requireSterilized: /steriliz|esteril/.test(normalized)
  };
};

const buildCompatibilityReasons = (
  sourcePet: PetModel,
  candidate: PetModel,
  preference: MatchPreferenceModel | null
): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];

  if (candidate.species === sourcePet.species) {
    score += 20;
    reasons.push("Misma especie, base importante para compatibilidad responsable.");
  }

  if (preference?.preferredBreed && candidate.breed.toLowerCase() === preference.preferredBreed.toLowerCase()) {
    score += 20;
    reasons.push("Coincide con la raza preferida.");
  }

  if (preference?.preferredSex && candidate.sex === preference.preferredSex) {
    score += 15;
    reasons.push("Coincide con el sexo preferido.");
  }

  if (
    preference?.minAge !== null &&
    preference?.minAge !== undefined &&
    preference?.maxAge !== null &&
    preference?.maxAge !== undefined &&
    candidate.age >= preference.minAge &&
    candidate.age <= preference.maxAge
  ) {
    score += 20;
    reasons.push("Edad dentro del rango preferido.");
  }

  if (candidate.isVaccinated) {
    score += 10;
    reasons.push("Cuenta con vacunación reportada.");
  }

  if (candidate.isSterilized) {
    score += 10;
    reasons.push("Cuenta con estado de esterilización reportado.");
  }

  if (reasons.length === 0) {
    reasons.push("Compatibilidad básica por criterios generales de bienestar.");
  }

  return {
    score,
    reasons
  };
};

export const matchService = {
  findCompatiblePets: async (authUserId: string, query: FindCompatiblePetsQueryDto): Promise<CompatiblePet[]> => {
    const sourcePet = await assertPetOwnership(authUserId, query.petId);
    const preference = await matchRepository.findPreferenceByPetId(sourcePet.id);
    const requirements = parseHealthRequirements(preference?.healthRequirements);

    const where: Prisma.PetWhereInput = {
      id: { not: sourcePet.id },
      ownerId: { not: sourcePet.ownerId },
      species: sourcePet.species
    };

    if (preference?.preferredBreed) {
      where.breed = preference.preferredBreed;
    }

    if (preference?.preferredSex) {
      where.sex = preference.preferredSex;
    }

    if (preference?.minAge !== null && preference?.minAge !== undefined) {
      where.age = {
        ...(where.age as Prisma.IntFilter | undefined),
        gte: preference.minAge
      };
    }

    if (preference?.maxAge !== null && preference?.maxAge !== undefined) {
      where.age = {
        ...(where.age as Prisma.IntFilter | undefined),
        lte: preference.maxAge
      };
    }

    if (requirements.requireVaccinated) {
      where.isVaccinated = true;
    }

    if (requirements.requireSterilized) {
      where.isSterilized = true;
    }

    if (preference?.preferredLocation) {
      where.owner = {
        OR: [
          {
            city: {
              contains: preference.preferredLocation,
              mode: "insensitive"
            }
          },
          {
            location: {
              contains: preference.preferredLocation,
              mode: "insensitive"
            }
          }
        ]
      };
    }

    const candidates = await matchRepository.findCandidatePets(where, query.limit ?? 20);

    return candidates
      .map((candidate) => {
        const result = buildCompatibilityReasons(sourcePet, candidate, preference);

        return {
          pet: candidate,
          compatibilityScore: result.score,
          reasons: [
            ...result.reasons,
            "Compatibilidad sugerida para crianza responsable; validar siempre con criterio profesional veterinario."
          ]
        };
      })
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  },

  upsertPreference: async (authUserId: string, payload: UpsertMatchPreferenceDto): Promise<MatchPreferenceModel> => {
    await assertPetOwnership(authUserId, payload.petId);
    return matchRepository.upsertPreference(payload);
  }
};