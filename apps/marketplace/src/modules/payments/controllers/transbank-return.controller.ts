import { PaymentProvider } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { paymentWebhookService } from "@/modules/payments/services";
import { paymentsRepository } from "@/modules/payments/repositories";

const DEFAULT_WEB_APP_URL = process.env.WEB_APP_URL ?? "https://petlink-web.vercel.app";

type TransbankReturnStatus = "approved" | "cancelled" | "failed";

type TransbankReturnPayload = {
  token_ws?: string | undefined;
  TBK_TOKEN?: string | undefined;
  TBK_ORDEN_COMPRA?: string | undefined;
  TBK_ID_SESION?: string | undefined;
};

const toPaymentMetadata = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const parseTransbankReturnPayload = async (request: NextRequest): Promise<TransbankReturnPayload> => {
  if (request.method === "GET") {
    return {
      token_ws: request.nextUrl.searchParams.get("token_ws") ?? undefined,
      TBK_TOKEN: request.nextUrl.searchParams.get("TBK_TOKEN") ?? undefined,
      TBK_ORDEN_COMPRA: request.nextUrl.searchParams.get("TBK_ORDEN_COMPRA") ?? undefined,
      TBK_ID_SESION: request.nextUrl.searchParams.get("TBK_ID_SESION") ?? undefined
    };
  }

  const rawBody = await request.text();
  const parsed = Object.fromEntries(new URLSearchParams(rawBody));

  return {
    token_ws: typeof parsed.token_ws === "string" ? parsed.token_ws : undefined,
    TBK_TOKEN: typeof parsed.TBK_TOKEN === "string" ? parsed.TBK_TOKEN : undefined,
    TBK_ORDEN_COMPRA: typeof parsed.TBK_ORDEN_COMPRA === "string" ? parsed.TBK_ORDEN_COMPRA : undefined,
    TBK_ID_SESION: typeof parsed.TBK_ID_SESION === "string" ? parsed.TBK_ID_SESION : undefined
  };
};

const isSafeHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const buildRedirectUrl = (baseUrl: string, params: Record<string, string | undefined>): string => {
  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

const resolveDefaultSubscriptionsUrl = (): string => {
  const trimmed = DEFAULT_WEB_APP_URL.replace(/\/$/, "");
  return `${trimmed}/subscriptions`;
};

const resolveTargetUrl = (candidate: unknown, fallback: string): string => {
  if (typeof candidate !== "string") {
    return fallback;
  }

  const trimmed = candidate.trim();
  if (!trimmed || !isSafeHttpUrl(trimmed)) {
    return fallback;
  }

  return trimmed;
};

const resolveRedirectTarget = (
  status: TransbankReturnStatus,
  paymentMetadata: Record<string, unknown> | undefined
): string => {
  const fallback = resolveDefaultSubscriptionsUrl();
  const metadata = paymentMetadata ?? {};

  if (status === "approved") {
    return resolveTargetUrl(metadata.successUrl, fallback);
  }

  return resolveTargetUrl(metadata.cancelUrl, fallback);
};

const resolveStatus = (payload: TransbankReturnPayload, paymentStatus: string | null | undefined): TransbankReturnStatus => {
  if (paymentStatus === "APPROVED") {
    return "approved";
  }

  if (payload.TBK_TOKEN && !payload.token_ws) {
    return "cancelled";
  }

  return "failed";
};

const resolvePaymentForRedirect = async (
  payload: TransbankReturnPayload,
  fallbackPaymentId?: string | null | undefined
) => {
  if (fallbackPaymentId) {
    const direct = await paymentsRepository.findById(fallbackPaymentId);
    if (direct) {
      return direct;
    }
  }

  if (payload.TBK_ORDEN_COMPRA) {
    const byReference = await paymentsRepository.findByProviderReference(PaymentProvider.TRANSBANK, payload.TBK_ORDEN_COMPRA);
    if (byReference) {
      return byReference;
    }
  }

  if (payload.token_ws) {
    const byProviderPaymentId = await paymentsRepository.findByProviderPaymentId(PaymentProvider.TRANSBANK, payload.token_ws);
    if (byProviderPaymentId) {
      return byProviderPaymentId;
    }
  }

  return null;
};

export const transbankReturnController = async (request: NextRequest): Promise<NextResponse> => {
  const payload = await parseTransbankReturnPayload(request);

  try {
    const webhookResult = await paymentWebhookService.processWebhook(PaymentProvider.TRANSBANK, payload);
    const payment = await resolvePaymentForRedirect(payload, webhookResult.payment?.id);

    const status = resolveStatus(payload, payment?.status);
    const paymentMetadata = toPaymentMetadata(payment?.metadata);
    const redirectTarget = resolveRedirectTarget(status, paymentMetadata);

    return NextResponse.redirect(
      buildRedirectUrl(redirectTarget, {
        paymentStatus: status,
        paymentId: payment?.id,
        planCode: typeof paymentMetadata.planCode === "string" ? paymentMetadata.planCode : undefined
      })
    );
  } catch {
    const fallback = resolveDefaultSubscriptionsUrl();
    return NextResponse.redirect(
      buildRedirectUrl(fallback, {
        paymentStatus: "failed"
      })
    );
  }
};
