import type { HealthRecordType } from "@prisma/client";

import type { HealthRecordModel } from "@/modules/health-records/types";

export type HealthRecordResponseDto = {
  id: string;
  petId: string;
  type: HealthRecordType;
  recordDate: string;
  description: string;
  notes: string | null;
  nextDueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export const toHealthRecordResponseDto = (record: HealthRecordModel): HealthRecordResponseDto => {
  return {
    id: record.id,
    petId: record.petId,
    type: record.type,
    recordDate: record.recordDate.toISOString(),
    description: record.description,
    notes: record.notes,
    nextDueDate: record.nextDueDate ? record.nextDueDate.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
};