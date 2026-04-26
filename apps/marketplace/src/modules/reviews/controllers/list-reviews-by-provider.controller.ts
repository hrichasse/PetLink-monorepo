import { NextRequest, NextResponse } from "next/server";

import { providerIdParamsSchema } from "@/modules/reviews/validators";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";
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

  const reviews = await reviewsService.listReviewsByProvider(validationResult.data.providerId);

  return ok(
    "Reviews fetched successfully.",
    reviews.map((review) => {
      return toReviewResponseDto(review);
    })
  );
};