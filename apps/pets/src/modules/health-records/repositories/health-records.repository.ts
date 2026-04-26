import type { HealthRecord, Pet, Prisma } from "@prisma/client";

import { prisma } from "@petlink/database";
import type { CreateHealthRecordDto, UpdateHealthRecordDto } from "@/modules/health-records/dtos";
import type { HealthRecordModel } from "@/modules/health-records/types";

const toCreateInput = (payload: CreateHealthRecordDto): Prisma.HealthRecordCreateInput => {
  const data: Prisma.HealthRecordCreateInput = {
    pet: {
      connect: {
        id: payload.petId
      }
    },
    type: payload.type,
    recordDate: payload.recordDate,
    description: payload.description
  };

  if (payload.notes !== undefined) {
    data.notes = payload.notes;
  }

  if (payload.nextDueDate !== undefined) {
    data.nextDueDate = payload.nextDueDate;
  }

  return data;
};

const toUpdateInput = (payload: UpdateHealthRecordDto): Prisma.HealthRecordUpdateInput => {
  const data: Prisma.HealthRecordUpdateInput = {};

  if (payload.type !== undefined) {
    data.type = payload.type;
  }

  if (payload.recordDate !== undefined) {
    data.recordDate = payload.recordDate;
  }

  if (payload.description !== undefined) {
    data.description = payload.description;
  }

  if (payload.notes !== undefined) {
    data.notes = payload.notes;
  }

  if (payload.nextDueDate !== undefined) {
    data.nextDueDate = payload.nextDueDate;
  }

  return data;
};

export const healthRecordsRepository = {
  findPetById: (id: string): Promise<Pet | null> => {
    return prisma.pet.findUnique({
      where: { id }
    });
  },

  create: (payload: CreateHealthRecordDto): Promise<HealthRecordModel> => {
    return prisma.healthRecord.create({
      data: toCreateInput(payload)
    });
  },

  findManyByPetId: (petId: string): Promise<HealthRecordModel[]> => {
    return prisma.healthRecord.findMany({
      where: { petId },
      orderBy: [{ recordDate: "desc" }, { createdAt: "desc" }]
    });
  },

  findById: (id: string): Promise<HealthRecord | null> => {
    return prisma.healthRecord.findUnique({
      where: { id }
    });
  },

  updateById: (id: string, payload: UpdateHealthRecordDto): Promise<HealthRecordModel> => {
    return prisma.healthRecord.update({
      where: { id },
      data: toUpdateInput(payload)
    });
  },

  deleteById: (id: string): Promise<HealthRecordModel> => {
    return prisma.healthRecord.delete({
      where: { id }
    });
  }
};