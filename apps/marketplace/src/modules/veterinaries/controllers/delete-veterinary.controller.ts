import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@petlink/shared";
import { veterinaryIdParamsSchema } from "@/modules/veterinaries/validators";
import { veterinariesService } from "@/modules/veterinaries/services";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";

type VeterinaryIdRouteParams = {
  params: { id: string };
};

export const deleteVeterinaryController = async (request: NextRequest, context: VeterinaryIdRouteParams): Promise<NextResponse> => {
  await requireAuth(request);

  const paramsResult = veterinaryIdParamsSchema.safeParse(context.params);

  if (!paramsResult.success) {
    throw new AppError("Invalid veterinary id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: paramsResult.error.flatten()
    });
  }

  await veterinariesService.deleteVeterinary(paramsResult.data.id);

  return ok("Veterinary deleted successfully.", null);
};
