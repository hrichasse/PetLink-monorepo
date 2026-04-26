import { NextRequest, NextResponse } from "next/server";

import { createReviewSchema } from "@/modules/reviews/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { created } from "@petlink/shared";
import { toReviewResponseDto } from "@/modules/reviews/dtos";
import { reviewsService } from "@/modules/reviews/services";

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

export const createReviewController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const body = await parseBody(request);
  const validationResult = createReviewSchema.safeParse(body);

  if (!validationResult.success) {
    throw new AppError("Invalid create review payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const review = await reviewsService.createReview(authUser.userId, validationResult.data);

  return created("Review created successfully.", toReviewResponseDto(review));
};