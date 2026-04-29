import { NextRequest, NextResponse } from "next/server";

import { toUserProfileResponseDto } from "@/modules/users/dtos";
import { usersService } from "@/modules/users/services";
import { createUserProfileSchema } from "@/modules/users/validators";
import { requireAuth, ok, created as createdResponse } from "@petlink/shared";
import { HTTP_STATUS, AppError, ERROR_CODES } from "@petlink/shared";

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

/**
 * POST /api/v1/users
 *
 * Idempotent endpoint: creates a UserProfile for the authenticated Supabase user.
 * - 201 Created   → profile was just created
 * - 200 OK        → profile already existed (no mutation, safe to call on every login)
 *
 * Design decision: idempotent 200 (vs 409 Conflict) was chosen so the web client
 * can unconditionally call this after every login without extra error-handling logic.
 */
export const createUserProfileController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const body = await parseBody(request);

  const validationResult = createUserProfileSchema.safeParse(body);

  if (!validationResult.success) {
    throw new AppError("Invalid profile creation payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const { fullName, phone, city, location } = validationResult.data;

  // Build DTO without undefined values (exactOptionalPropertyTypes constraint)
  const payload: import("@/modules/users/dtos").CreateUserProfileDto = { fullName };
  if (phone !== undefined) payload.phone = phone;
  if (city !== undefined) payload.city = city;
  if (location !== undefined) payload.location = location;

  const { profile, isNew } = await usersService.createOrGetProfile(
    authUser.userId,
    payload
  );

  const dto = toUserProfileResponseDto(profile);

  if (isNew) {
    return createdResponse("User profile created successfully.", dto);
  }

  return ok("User profile already exists.", dto);
};
