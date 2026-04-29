import { NextRequest, NextResponse } from "next/server";

import { paymentWebhookService } from "@/modules/payments/services";
import { paymentProviderFactory } from "@/modules/payments/providers";
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

const parseBody = (rawBody: string): unknown => {
  // Try JSON first (MercadoPago, normalized).
  try {
    return JSON.parse(rawBody);
  } catch {
    // No-op
  }

  // Try URL-encoded (Transbank redirects POST with token_ws).
  try {
    return Object.fromEntries(new URLSearchParams(rawBody));
  } catch {
    throw new AppError("Request body must be valid JSON or URL-encoded form data.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
};

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

  // Read raw body once so it can be used for both signature verification and parsing.
  const rawBody = await request.text();

  // Build a plain headers map for signature verification.
  const headers: Record<string, string | null> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Signature verification (optional per provider — skipped when no secret configured).
  const providerAdapter = paymentProviderFactory.create(paramsResult.data.provider);

  if (typeof providerAdapter.verifyWebhookRequest === "function") {
    const isValid = providerAdapter.verifyWebhookRequest(headers, rawBody);

    if (!isValid) {
      throw new AppError("Invalid webhook signature.", {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        code: ERROR_CODES.UNAUTHORIZED
      });
    }
  }

  const body = parseBody(rawBody);
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

