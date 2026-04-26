import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@petlink/shared";
import { toPaymentResponseDto } from "@/modules/payments/dtos";
import { paymentsService } from "@/modules/payments/services";
import { ok } from "@petlink/shared";

export const listMyPaymentsController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const payments = await paymentsService.listMyPayments(authUser.userId);

  return ok(
    "Payments fetched successfully.",
    payments.map((payment) => {
      return toPaymentResponseDto(payment);
    })
  );
};
