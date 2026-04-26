import { NextRequest, NextResponse } from "next/server";

import { listVeterinariesQuerySchema } from "@/modules/veterinaries/validators";
import { veterinariesService } from "@/modules/veterinaries/services";
import { toVeterinaryResponseDto } from "@/modules/veterinaries/dtos";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";

export const listVeterinariesController = async (request: NextRequest): Promise<NextResponse> => {
  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
  const validationResult = listVeterinariesQuerySchema.safeParse(rawQuery);

  if (!validationResult.success) {
    throw new AppError("Invalid veterinary filters.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const vets = await veterinariesService.listVeterinaries(validationResult.data);

  return ok(
    "Veterinaries fetched successfully.",
    vets.map((vet) => toVeterinaryResponseDto(vet))
  );
};
