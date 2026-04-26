import { PaymentStatus } from "@prisma/client";
import type { Prisma, PaymentProvider } from "@prisma/client";

import { paymentProviderFactory } from "@/modules/payments/providers";
import { paymentsRepository } from "@/modules/payments/repositories";
import type { PaymentWebhookDto, PaymentResponseDto } from "@/modules/payments/dtos";
import type { PaymentModel, PaymentWebhookEventModel } from "@/modules/payments/types";
import { subscriptionsService } from "@/modules/subscriptions/services";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { NotFoundError } from "@petlink/shared";
import { buildWebhookEventLookup, isWebhookEventAlreadyProcessed } from "@/modules/payments/utils/webhook-idempotency";

const toMetadataRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
};

const mergeMetadata = (...chunks: Array<unknown>): Prisma.InputJsonValue | undefined => {
  const merged = chunks.reduce<Record<string, unknown>>((accumulator, currentChunk) => {
    return {
      ...accumulator,
      ...toMetadataRecord(currentChunk)
    };
  }, {});

  return Object.keys(merged).length === 0 ? undefined : (merged as Prisma.InputJsonObject);
};

const buildPaymentUpdateInput = (payload: {
  status?: PaymentStatus | undefined;
  providerPaymentId?: string | null | undefined;
  providerReference?: string | null | undefined;
  paymentMethod?: string | null | undefined;
  paidAt?: Date | undefined;
  metadata?: Prisma.InputJsonValue | undefined;
}): Prisma.PaymentUpdateInput => {
  const data: Prisma.PaymentUpdateInput = {};

  if (payload.status !== undefined) {
    data.status = payload.status;
  }

  if (payload.providerPaymentId !== undefined) {
    data.providerPaymentId = payload.providerPaymentId;
  }

  if (payload.providerReference !== undefined) {
    data.providerReference = payload.providerReference;
  }

  if (payload.paymentMethod !== undefined) {
    data.paymentMethod = payload.paymentMethod;
  }

  if (payload.paidAt !== undefined) {
    data.paidAt = payload.paidAt;
  }

  if (payload.metadata !== undefined) {
    data.metadata = payload.metadata;
  }

  return data;
};

const resolvePaymentForWebhook = async (
  provider: PaymentProvider,
  payload: PaymentWebhookDto
): Promise<PaymentModel> => {
  if (payload.paymentId) {
    const payment = await paymentsRepository.findById(payload.paymentId);

    if (!payment) {
      throw new NotFoundError("Payment not found for webhook event.");
    }

    if (payment.provider !== provider) {
      throw new AppError("Webhook provider does not match payment provider.", {
        statusCode: HTTP_STATUS.CONFLICT,
        code: ERROR_CODES.CONFLICT
      });
    }

    return payment;
  }

  if (payload.providerPaymentId) {
    const payment = await paymentsRepository.findByProviderPaymentId(provider, payload.providerPaymentId);

    if (payment) {
      return payment;
    }
  }

  if (payload.providerReference) {
    const payment = await paymentsRepository.findByProviderReference(provider, payload.providerReference);

    if (payment) {
      return payment;
    }
  }

  throw new NotFoundError("Payment not found for webhook event.");
};

export const paymentWebhookService = {
  processWebhook: async (
    provider: PaymentProvider,
    payload: PaymentWebhookDto
  ): Promise<{ event: PaymentWebhookEventModel; payment: PaymentModel | null; alreadyProcessed: boolean }> => {
    const providerAdapter = paymentProviderFactory.create(provider);
    const normalizedPayload = await providerAdapter.parseWebhookPayload(payload as Record<string, unknown>);
    const eventLookup = buildWebhookEventLookup(provider, normalizedPayload.externalEventId ?? payload.externalEventId ?? null);

    let existingEvent: PaymentWebhookEventModel | null = null;

    if (eventLookup) {
      existingEvent = await paymentsRepository.findWebhookEventByProviderAndExternalEventId(
        eventLookup.provider,
        eventLookup.externalEventId
      );

      if (existingEvent && isWebhookEventAlreadyProcessed(existingEvent)) {
        return {
          event: existingEvent,
          payment: null,
          alreadyProcessed: true
        };
      }
    }

    const event = existingEvent
      ? existingEvent
      : await paymentsRepository.createWebhookEvent(
          provider,
          normalizedPayload.eventType,
          normalizedPayload.externalEventId,
          payload as Prisma.InputJsonValue
        );

    const payment = await resolvePaymentForWebhook(provider, {
      ...payload,
      ...normalizedPayload,
      status: normalizedPayload.status ?? payload.status
    });

    const nextStatus = normalizedPayload.status ?? payload.status ?? PaymentStatus.PENDING;
    const updatedPayment = await paymentsRepository.updateById(
      payment.id,
      buildPaymentUpdateInput({
        status: nextStatus,
        providerPaymentId: normalizedPayload.providerPaymentId ?? payment.providerPaymentId,
        providerReference: normalizedPayload.providerReference ?? payment.providerReference,
        paymentMethod: normalizedPayload.paymentMethod,
        paidAt: nextStatus === PaymentStatus.APPROVED ? new Date() : undefined,
        metadata: mergeMetadata(payment.metadata, payload.metadata, normalizedPayload.metadata, {
          lastWebhookEventType: normalizedPayload.eventType,
          lastExternalEventId: normalizedPayload.externalEventId
        })
      })
    );

    if (payment.status !== PaymentStatus.APPROVED && updatedPayment.status === PaymentStatus.APPROVED) {
      await subscriptionsService.activateOrRefreshSubscriptionFromApprovedPayment(updatedPayment);
    }

    const processedEvent = await paymentsRepository.markWebhookEventProcessed(event.id);

    return {
      event: processedEvent,
      payment: updatedPayment,
      alreadyProcessed: false
    };
  }
};
