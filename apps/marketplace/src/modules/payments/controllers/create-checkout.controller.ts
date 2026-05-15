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

const parseUrlOrThrow = (value: string, fieldName: string): URL => {
  try {
    return new URL(value);
  } catch {
    throw new AppError(`Invalid ${fieldName}.`, {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
};

const validateSameOriginRedirect = (value: string | undefined, origin: string | null, fieldName: string): void => {
  if (!value || !origin) {
    return;
  }

  const parsed = parseUrlOrThrow(value, fieldName);
  if (parsed.origin !== origin) {
    throw new AppError(`${fieldName} must match request origin.`, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: {
        expectedOrigin: origin,
        receivedOrigin: parsed.origin
      }
    });
  }
};

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

  const requestOrigin = request.headers.get("origin");
  validateSameOriginRedirect(validationResult.data.successUrl, requestOrigin, "successUrl");
  validateSameOriginRedirect(validationResult.data.cancelUrl, requestOrigin, "cancelUrl");

  const transbankReturnUrl = new URL("/api/v1/payments/transbank/return", request.nextUrl.origin).toString();
  const result = await paymentsService.createCheckout(authUser.userId, validationResult.data, {
    transbankReturnUrl
  });

  return created("Checkout created successfully.", toPaymentCheckoutResponseDto(result.payment, result.checkout));
};
