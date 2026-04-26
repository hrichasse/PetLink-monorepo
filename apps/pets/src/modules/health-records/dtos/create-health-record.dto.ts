import type { HealthRecordType } from "@prisma/client";

export type CreateHealthRecordDto = {
  petId: string;
  type: HealthRecordType;
  recordDate: Date;
  description: string;
  notes?: string | null | undefined;
  nextDueDate?: Date | null | undefined;
};