import { NextRequest, NextResponse } from "next/server";

import { petIdParamsSchema } from "@/modules/health-records/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";
import { toHealthRecordResponseDto } from "@/modules/health-records/dtos";
import { healthRecordsService } from "@/modules/health-records/services";

type PetIdRouteParams = {
  params: {
    petId: string;
  };
};

export const listHealthRecordsByPetController = async (
  request: NextRequest,
  context: PetIdRouteParams
): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const validationResult = petIdParamsSchema.safeParse(context.params);

  if (!validationResult.success) {
    throw new AppError("Invalid pet id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const records = await healthRecordsService.listByPetId(authUser.userId, validationResult.data.petId);

  return ok(
    "Health records fetched successfully.",
    records.map((record) => {
      return toHealthRecordResponseDto(record);
    })
  );
};