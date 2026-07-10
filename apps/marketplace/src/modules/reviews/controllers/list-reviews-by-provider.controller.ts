import { NextRequest, NextResponse } from "next/server";

import { providerIdParamsSchema } from "@/modules/reviews/validators";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { okPaginated, parsePagination, buildPaginationMeta } from "@petlink/shared";
import { toReviewResponseDto } from "@/modules/reviews/dtos";
import { reviewsService } from "@/modules/reviews/services";

type ProviderIdRouteParams = {
  params: {
    providerId: string;
  };
};

export const listReviewsByProviderController = async (
  request: NextRequest,
  context: ProviderIdRouteParams
): Promise<NextResponse> => {
  const validationResult = providerIdParamsSchema.safeParse(context.params);

  if (!validationResult.success) {
    throw new AppError("Invalid provider id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const pagination = parsePagination(request.nextUrl.searchParams);
  const { items, total } = await reviewsService.listReviewsByProvider(validationResult.data.providerId, pagination);

  return okPaginated(
    "Reviews fetched successfully.",
    items.map((review) => toReviewResponseDto(review)),
    buildPaginationMeta(pagination, total)
  );
};