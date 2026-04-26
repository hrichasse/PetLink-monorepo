import { NextRequest, NextResponse } from "next/server";

import { toPetResponseDto } from "@/modules/pets/dtos";
import { petsService } from "@/modules/pets/services";
import { petIdParamsSchema, updatePetSchema } from "@/modules/pets/validators";
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

const parseBody = async (request: NextRequest): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
};

export const updatePetController = async (request: NextRequest, context: PetIdRouteParams): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const paramsValidation = petIdParamsSchema.safeParse(context.params);

  if (!paramsValidation.success) {
    throw new AppError("Invalid pet id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: paramsValidation.error.flatten()
    });
  }

  const body = await parseBody(request);
  const bodyValidation = updatePetSchema.safeParse(body);

  if (!bodyValidation.success) {
    throw new AppError("Invalid update pet payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: bodyValidation.error.flatten()
    });
  }

  const pet = await petsService.updatePetForUser(authUser.userId, paramsValidation.data.id, bodyValidation.data);

  return ok("Pet updated successfully.", toPetResponseDto(pet));
};