import { NextRequest, NextResponse } from "next/server";

import { listServicesQuerySchema } from "@/modules/services/validators";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { okPaginated, parsePagination, buildPaginationMeta, withPublicCache } from "@petlink/shared";
import { toServiceResponseDto } from "@/modules/services/dtos";
import { servicesService } from "@/modules/services/services";

export const listServicesController = async (request: NextRequest): Promise<NextResponse> => {
  const searchParams = request.nextUrl.searchParams;
  // Pagination is parsed separately; the strict filter schema below rejects
  // unknown keys, so page/pageSize must not reach it.
  const { page: _page, pageSize: _pageSize, ...rawFilters } = Object.fromEntries(searchParams.entries());
  const validationResult = listServicesQuerySchema.safeParse(rawFilters);

  if (!validationResult.success) {
    throw new AppError("Invalid services filters.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const pagination = parsePagination(searchParams);
  const { items, total } = await servicesService.listServices(validationResult.data, pagination);

  return withPublicCache(
    okPaginated(
      "Services fetched successfully.",
      items.map((service) => toServiceResponseDto(service)),
      buildPaginationMeta(pagination, total)
    )
  );
};