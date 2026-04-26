import { NextRequest, NextResponse } from "next/server";

import { toUserProfileResponseDto } from "@/modules/users/dtos";
import { usersService } from "@/modules/users/services";
import { requireAuth } from "@petlink/shared";
import { ok } from "@petlink/shared";

export const getMeController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const profile = await usersService.getAuthenticatedProfile(authUser.userId);

  return ok("User profile fetched successfully.", toUserProfileResponseDto(profile));
};