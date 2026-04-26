import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@petlink/shared";
import { createVeterinarySchema } from "@/modules/veterinaries/validators";
import { veterinariesService } from "@/modules/veterinaries/services";
import { toVeterinaryResponseDto } from "@/modules/veterinaries/dtos";
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

export const createVeterinaryController = async (request: NextRequest): Promise<NextResponse> => {
  await requireAuth(request);
  const body = await parseBody(request);
  const validationResult = createVeterinarySchema.safeParse(body);

  if (!validationResult.success) {
    throw new AppError("Invalid create veterinary payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const vet = await veterinariesService.createVeterinary(validationResult.data);

  return created("Veterinary created successfully.", toVeterinaryResponseDto(vet));
};
