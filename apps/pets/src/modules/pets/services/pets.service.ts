import type { CreatePetDto, UpdatePetDto } from "@/modules/pets/dtos";
import { petsRepository } from "@/modules/pets/repositories";
import type { PetModel } from "@/modules/pets/types";
import { Prisma } from "@prisma/client";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { NotFoundError } from "@petlink/shared";

const PET_NOT_FOUND_MESSAGE = "Pet not found.";
const PET_FORBIDDEN_MESSAGE = "You do not have access to this pet.";

const ensureOwnerAccess = (pet: PetModel, authUserId: string): void => {
  if (pet.ownerId !== authUserId) {
    throw new AppError(PET_FORBIDDEN_MESSAGE, {
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: ERROR_CODES.FORBIDDEN
    });
  }
};

export const petsService = {
  createPet: (authUserId: string, payload: CreatePetDto): Promise<PetModel> => {
    return petsRepository.create(authUserId, payload);
  },

  listAuthenticatedUserPets: (authUserId: string): Promise<PetModel[]> => {
    return petsRepository.findManyByOwnerId(authUserId);
  },

  getPetByIdForUser: async (authUserId: string, petId: string): Promise<PetModel> => {
    const pet = await petsRepository.findById(petId);

    if (!pet) {
      throw new NotFoundError(PET_NOT_FOUND_MESSAGE);
    }

    ensureOwnerAccess(pet, authUserId);

    return pet;
  },

  updatePetForUser: async (authUserId: string, petId: string, payload: UpdatePetDto): Promise<PetModel> => {
    await petsService.getPetByIdForUser(authUserId, petId);

    return petsRepository.updateById(petId, payload);
  },

  deletePetForUser: async (authUserId: string, petId: string): Promise<void> => {
    await petsService.getPetByIdForUser(authUserId, petId);
    try {
      await petsRepository.deleteById(petId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new AppError("Cannot delete pet with related bookings. Cancel those bookings first.", {
          statusCode: HTTP_STATUS.CONFLICT,
          code: ERROR_CODES.CONFLICT
        });
      }

      throw error;
    }
  }
};