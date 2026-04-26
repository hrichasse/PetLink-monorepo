import type { PaymentCheckoutSession, PaymentModel } from "@/modules/payments/types";
import { toPaymentResponseDto, type PaymentResponseDto } from "@/modules/payments/dtos/payment-response.dto";

export type PaymentCheckoutResponseDto = {
  payment: PaymentResponseDto;
  checkoutUrl: string | null;
  providerPaymentId: string | null;
  providerReference: string | null;
};

export const toPaymentCheckoutResponseDto = (
  payment: PaymentModel,
  checkout: PaymentCheckoutSession
): PaymentCheckoutResponseDto => {
  return {
    payment: toPaymentResponseDto(payment),
    checkoutUrl: checkout.checkoutUrl,
    providerPaymentId: checkout.providerPaymentId,
    providerReference: checkout.providerReference
  };
};
