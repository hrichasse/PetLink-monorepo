import { NextRequest, NextResponse } from "next/server";

import { toUserProfileResponseDto } from "@/modules/users/dtos";
import { usersService } from "@/modules/users/services";
import { requireAuth } from "@petlink/shared";
import { ok } from "@petlink/shared";

function isUserRole(value: string | undefined): value is "OWNER" | "PROVIDER" | "ADMIN" {
  return value === "OWNER" || value === "PROVIDER" || value === "ADMIN";
}

export const getMeController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const fallbackFullName = authUser.email?.split("@")[0] ?? "Usuario PetLink";
  const fallbackProfile: import("@/modules/users/dtos").CreateUserProfileDto = {
    fullName: fallbackFullName,
    phone: null,
    city: null,
    location: null
  };
  if (isUserRole(authUser.role)) fallbackProfile.role = authUser.role;

  const profile = await usersService.ensureAuthenticatedProfile(authUser.userId, fallbackProfile);

  return ok("User profile fetched successfully.", toUserProfileResponseDto(profile));
};