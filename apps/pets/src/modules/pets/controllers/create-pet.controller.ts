import { NextRequest, NextResponse } from "next/server";

import { toPetResponseDto } from "@/modules/pets/dtos";
import { petsService } from "@/modules/pets/services";
import { createPetSchema } from "@/modules/pets/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { created } from "@petlink/shared";

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

export const createPetController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const body = await parseBody(request);
  const validationResult = createPetSchema.safeParse(body);

  if (!validationResult.success) {
    throw new AppError("Invalid create pet payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const pet = await petsService.createPet(authUser.userId, validationResult.data);

  return created("Pet created successfully.", toPetResponseDto(pet));
};