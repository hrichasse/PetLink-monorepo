import { NextRequest, NextResponse } from "next/server";

import { toPetResponseDto } from "@/modules/pets/dtos";
import { petsService } from "@/modules/pets/services";
import { requireAuth } from "@petlink/shared";
import { okPaginated, parsePagination, buildPaginationMeta } from "@petlink/shared";

export const listMyPetsController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const pagination = parsePagination(request.nextUrl.searchParams);
  const { items, total } = await petsService.listAuthenticatedUserPets(authUser.userId, pagination);

  return okPaginated(
    "Pets fetched successfully.",
    items.map((pet) => toPetResponseDto(pet)),
    buildPaginationMeta(pagination, total)
  );
};