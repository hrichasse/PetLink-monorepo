import { NextRequest, NextResponse } from "next/server";

import { findCompatiblePetsQuerySchema } from "@/modules/match/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";
import { toCompatiblePetResponseDto } from "@/modules/match/dtos";
import { matchService } from "@/modules/match/services";

export const findCompatiblePetsController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
  const validationResult = findCompatiblePetsQuerySchema.safeParse(rawQuery);

  if (!validationResult.success) {
    throw new AppError("Invalid match query.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const matches = await matchService.findCompatiblePets(authUser.userId, validationResult.data);

  return ok(
    "Compatible pets fetched successfully for responsible breeding guidance.",
    matches.map((match) => {
      return toCompatiblePetResponseDto(match);
    })
  );
};