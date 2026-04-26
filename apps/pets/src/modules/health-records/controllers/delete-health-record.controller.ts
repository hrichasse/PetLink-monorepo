import { NextRequest, NextResponse } from "next/server";

import { healthRecordIdParamsSchema } from "@/modules/health-records/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";
import { healthRecordsService } from "@/modules/health-records/services";

type HealthRecordIdRouteParams = {
  params: {
    id: string;
  };
};

export const deleteHealthRecordController = async (
  request: NextRequest,
  context: HealthRecordIdRouteParams
): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const paramsValidation = healthRecordIdParamsSchema.safeParse(context.params);

  if (!paramsValidation.success) {
    throw new AppError("Invalid health record id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: paramsValidation.error.flatten()
    });
  }

  await healthRecordsService.deleteHealthRecord(authUser.userId, paramsValidation.data.id);

  return ok("Health record deleted successfully.", null);
};