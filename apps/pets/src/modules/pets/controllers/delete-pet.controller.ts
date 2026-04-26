import { NextRequest, NextResponse } from "next/server";

import { petsService } from "@/modules/pets/services";
import { petIdParamsSchema } from "@/modules/pets/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";

type PetIdRouteParams = {
  params: {
    id: string;
  };
};

export const deletePetController = async (request: NextRequest, context: PetIdRouteParams): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const paramsValidation = petIdParamsSchema.safeParse(context.params);

  if (!paramsValidation.success) {
    throw new AppError("Invalid pet id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: paramsValidation.error.flatten()
    });
  }

  await petsService.deletePetForUser(authUser.userId, paramsValidation.data.id);

  return ok("Pet deleted successfully.", null);
};