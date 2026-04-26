import { NextRequest, NextResponse } from "next/server";

import { toPetResponseDto } from "@/modules/pets/dtos";
import { petsService } from "@/modules/pets/services";
import { requireAuth } from "@petlink/shared";
import { ok } from "@petlink/shared";

export const listMyPetsController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const pets = await petsService.listAuthenticatedUserPets(authUser.userId);

  return ok(
    "Pets fetched successfully.",
    pets.map((pet) => {
      return toPetResponseDto(pet);
    })
  );
};