import type { CreateHealthRecordDto, UpdateHealthRecordDto } from "@/modules/health-records/dtos";
import { healthRecordsRepository } from "@/modules/health-records/repositories";
import type { HealthRecordModel } from "@/modules/health-records/types";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { NotFoundError } from "@petlink/shared";

const HEALTH_RECORD_NOT_FOUND = "Health record not found.";
const PET_NOT_FOUND = "Pet not found.";
const PET_FORBIDDEN = "You do not have access to this pet.";

const assertPetOwnership = async (authUserId: string, petId: string): Promise<void> => {
  const pet = await healthRecordsRepository.findPetById(petId);

  if (!pet) {
    throw new NotFoundError(PET_NOT_FOUND);
  }

  if (pet.ownerId !== authUserId) {
    throw new AppError(PET_FORBIDDEN, {
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: ERROR_CODES.FORBIDDEN
    });
  }
};

const assertDateConsistency = (recordDate?: Date, nextDueDate?: Date | null): void => {
  if (!recordDate || !nextDueDate) {
    return;
  }

  if (nextDueDate.getTime() < recordDate.getTime()) {
    throw new AppError("nextDueDate must be greater than or equal to recordDate.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
};

export const healthRecordsService = {
  createHealthRecord: async (authUserId: string, payload: CreateHealthRecordDto): Promise<HealthRecordModel> => {
    assertDateConsistency(payload.recordDate, payload.nextDueDate);
    await assertPetOwnership(authUserId, payload.petId);

    return healthRecordsRepository.create(payload);
  },

  listByPetId: async (authUserId: string, petId: string): Promise<HealthRecordModel[]> => {
    await assertPetOwnership(authUserId, petId);
    return healthRecordsRepository.findManyByPetId(petId);
  },

  updateHealthRecord: async (
    authUserId: string,
    healthRecordId: string,
    payload: UpdateHealthRecordDto
  ): Promise<HealthRecordModel> => {
    const existing = await healthRecordsRepository.findById(healthRecordId);

    if (!existing) {
      throw new NotFoundError(HEALTH_RECORD_NOT_FOUND);
    }

    await assertPetOwnership(authUserId, existing.petId);
    assertDateConsistency(payload.recordDate ?? existing.recordDate, payload.nextDueDate ?? existing.nextDueDate);

    return healthRecordsRepository.updateById(healthRecordId, payload);
  },

  deleteHealthRecord: async (authUserId: string, healthRecordId: string): Promise<void> => {
    const existing = await healthRecordsRepository.findById(healthRecordId);

    if (!existing) {
      throw new NotFoundError(HEALTH_RECORD_NOT_FOUND);
    }

    await assertPetOwnership(authUserId, existing.petId);
    await healthRecordsRepository.deleteById(healthRecordId);
  }
};