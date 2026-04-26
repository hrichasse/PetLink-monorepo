import { NextRequest, NextResponse } from "next/server";

import { paymentWebhookService } from "@/modules/payments/services";
import { paymentProviderParamsSchema, paymentWebhookSchema } from "@/modules/payments/validators";
import { toPaymentResponseDto } from "@/modules/payments/dtos";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";

type PaymentProviderRouteParams = {
  params: {
    provider: string;
  };
};

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

export const paymentWebhookController = async (
  request: NextRequest,
  context: PaymentProviderRouteParams
): Promise<NextResponse> => {
  const paramsResult = paymentProviderParamsSchema.safeParse(context.params);

  if (!paramsResult.success) {
    throw new AppError("Invalid payment provider.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: paramsResult.error.flatten()
    });
  }

  const body = await parseBody(request);
  const validationResult = paymentWebhookSchema.safeParse(body);

  if (!validationResult.success) {
    throw new AppError("Invalid webhook payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const result = await paymentWebhookService.processWebhook(paramsResult.data.provider, validationResult.data);

  return ok("Webhook processed successfully.", {
    eventId: result.event.id,
    alreadyProcessed: result.alreadyProcessed,
    payment: result.payment ? toPaymentResponseDto(result.payment) : null
  });
};
