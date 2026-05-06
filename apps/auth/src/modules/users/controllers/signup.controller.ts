import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient, getSupabaseClient } from "@petlink/shared";
import { usersRepository } from "@/modules/users/repositories";
import { toUserProfileResponseDto } from "@/modules/users/dtos";
import { ok, created as createdResponse, AppError, ERROR_CODES, HTTP_STATUS } from "@petlink/shared";

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().trim().min(2).max(120),
    role: z.enum(["OWNER", "PROVIDER"]),
  })
  .strict();

/**
 * POST /api/v1/auth/signup
 *
 * Public endpoint. Creates a Supabase user (admin API, no email rate limit,
 * email auto-confirmed) + signs them in + creates their UserProfile.
 * Returns { access_token, refresh_token, user, profile }.
 */
export const signupController = async (request: NextRequest): Promise<NextResponse> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
    });
  }

  const result = signupSchema.safeParse(body);
  if (!result.success) {
    throw new AppError("Invalid signup payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: result.error.flatten(),
    });
  }

  const { email, password, fullName, role } = result.data;

  const adminClient = getSupabaseAdminClient();

  // Check if user already exists (admin list is not available, rely on createUser error)
  const { data: createdAuthUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip confirmation email entirely
    user_metadata: { full_name: fullName, role },
  });

  if (createError) {
    // Supabase returns "User already registered" for duplicates
    const isDuplicate =
      createError.message.toLowerCase().includes("already") ||
      createError.message.toLowerCase().includes("registered") ||
      createError.code === "email_exists";

    throw new AppError(isDuplicate ? "Este correo ya está registrado." : createError.message, {
      statusCode: isDuplicate ? HTTP_STATUS.CONFLICT : HTTP_STATUS.BAD_REQUEST,
      code: isDuplicate ? ERROR_CODES.CONFLICT : ERROR_CODES.VALIDATION_ERROR,
    });
  }

  const authUserId = createdAuthUser.user.id;

  // Sign in immediately to get session tokens
  const anonClient = getSupabaseClient();
  const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session) {
    // User was created but sign-in failed — clean up
    await adminClient.auth.admin.deleteUser(authUserId);
    throw new AppError("Usuario creado pero no se pudo iniciar sesión. Intenta ingresar manualmente.", {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
    });
  }

  // Create profile in our DB
  const existing = await usersRepository.findByAuthUserId(authUserId);
  const profile = existing ?? (await usersRepository.create(authUserId, { fullName, role }));
  const isNew = !existing;

  const responseBody = {
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
    user: signInData.user,
    profile: toUserProfileResponseDto(profile),
  };

  return isNew ? createdResponse(responseBody) : ok(responseBody);
};
