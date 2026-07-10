import { NextRequest, NextResponse } from "next/server";

import { listVeterinariesQuerySchema } from "@/modules/veterinaries/validators";
import { veterinariesService } from "@/modules/veterinaries/services";
import { toVeterinaryResponseDto } from "@/modules/veterinaries/dtos";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { okPaginated, parsePagination, buildPaginationMeta } from "@petlink/shared";

export const listVeterinariesController = async (request: NextRequest): Promise<NextResponse> => {
  const searchParams = request.nextUrl.searchParams;
  const { page: _page, pageSize: _pageSize, ...rawFilters } = Object.fromEntries(searchParams.entries());
  const validationResult = listVeterinariesQuerySchema.safeParse(rawFilters);

  if (!validationResult.success) {
    throw new AppError("Invalid veterinary filters.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const pagination = parsePagination(searchParams);
  const { items, total } = await veterinariesService.listVeterinaries(validationResult.data, pagination);

  return okPaginated(
    "Veterinaries fetched successfully.",
    items.map((vet) => toVeterinaryResponseDto(vet)),
    buildPaginationMeta(pagination, total)
  );
};
