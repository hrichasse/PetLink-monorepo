import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@petlink/shared";
import { toPaymentResponseDto } from "@/modules/payments/dtos";
import { paymentsService } from "@/modules/payments/services";
import { paymentIdParamsSchema } from "@/modules/payments/validators";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";

type PaymentIdRouteParams = {
  params: {
    id: string;
  };
};

export const getPaymentByIdController = async (
  request: NextRequest,
  context: PaymentIdRouteParams
): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const validationResult = paymentIdParamsSchema.safeParse(context.params);

  if (!validationResult.success) {
    throw new AppError("Invalid payment id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const payment = await paymentsService.getPaymentByIdForUser(authUser.userId, validationResult.data.id);

  return ok("Payment fetched successfully.", toPaymentResponseDto(payment));
};
