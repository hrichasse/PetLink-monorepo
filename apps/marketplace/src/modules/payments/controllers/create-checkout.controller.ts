import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@petlink/shared";
import { createCheckoutSchema } from "@/modules/payments/validators";
import { paymentsService } from "@/modules/payments/services";
import { toPaymentCheckoutResponseDto } from "@/modules/payments/dtos";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { created } from "@petlink/shared";

async function parseBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
}

export const createCheckoutController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const body = await parseBody(request);
  const validationResult = createCheckoutSchema.safeParse(body);

  if (!validationResult.success) {
    throw new AppError("Invalid create checkout payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const result = await paymentsService.createCheckout(authUser.userId, validationResult.data);

  return created("Checkout created successfully.", toPaymentCheckoutResponseDto(result.payment, result.checkout));
};
