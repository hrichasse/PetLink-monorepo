import type { PaymentProvider, PaymentStatus } from "@prisma/client";

import type { PaymentModel } from "@/modules/payments/types";

export type PaymentResponseDto = {
  id: string;
  subscriptionId: string | null;
  provider: PaymentProvider;
  providerPaymentId: string | null;
  providerReference: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
  description: string;
  paymentMethod: string | null;
  paidAt: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
};

export const toPaymentResponseDto = (payment: PaymentModel): PaymentResponseDto => {
  return {
    id: payment.id,
    subscriptionId: payment.subscriptionId ?? null,
    provider: payment.provider,
    providerPaymentId: payment.providerPaymentId ?? null,
    providerReference: payment.providerReference ?? null,
    status: payment.status,
    amount: Number(payment.amount),
    currency: payment.currency,
    description: payment.description,
    paymentMethod: payment.paymentMethod ?? null,
    paidAt: payment.paidAt?.toISOString() ?? null,
    metadata: payment.metadata ?? null,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString()
  };
};
