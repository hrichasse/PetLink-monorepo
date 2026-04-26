import type { HealthRecordType } from "@prisma/client";

export type UpdateHealthRecordDto = {
  type?: HealthRecordType | undefined;
  recordDate?: Date | undefined;
  description?: string | undefined;
  notes?: string | null | undefined;
  nextDueDate?: Date | null | undefined;
};