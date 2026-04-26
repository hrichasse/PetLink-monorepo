export type ConfirmPaymentStatus = "APPROVED" | "REJECTED" | "CANCELLED" | "FAILED";

export type ConfirmPaymentDto = {
  status: ConfirmPaymentStatus;
  providerPaymentId?: string | null | undefined;
  providerReference?: string | null | undefined;
  paymentMethod?: string | null | undefined;
  metadata?: Record<string, unknown> | undefined;
};
