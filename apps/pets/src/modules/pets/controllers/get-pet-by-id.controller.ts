import { NextRequest, NextResponse } from "next/server";

import { toPetResponseDto } from "@/modules/pets/dtos";
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

export const getPetByIdController = async (request: NextRequest, context: PetIdRouteParams): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const validationResult = petIdParamsSchema.safeParse(context.params);

  if (!validationResult.success) {
    throw new AppError("Invalid pet id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const pet = await petsService.getPetByIdForUser(authUser.userId, validationResult.data.id);

  return ok("Pet fetched successfully.", toPetResponseDto(pet));
};