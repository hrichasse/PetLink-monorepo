import { NextRequest, NextResponse } from "next/server";

import { toUserProfileResponseDto } from "@/modules/users/dtos";
import { usersService } from "@/modules/users/services";
import { updateUserProfileSchema } from "@/modules/users/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";

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

export const updateMeController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const body = await parseBody(request);

  const validationResult = updateUserProfileSchema.safeParse(body);

  if (!validationResult.success) {
    throw new AppError("Invalid profile update payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const profile = await usersService.updateAuthenticatedProfile(authUser.userId, validationResult.data);

  return ok("User profile updated successfully.", toUserProfileResponseDto(profile));
};