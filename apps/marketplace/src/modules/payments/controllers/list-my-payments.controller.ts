import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@petlink/shared";
import { toPaymentResponseDto } from "@/modules/payments/dtos";
import { paymentsService } from "@/modules/payments/services";
import { okPaginated, parsePagination, buildPaginationMeta } from "@petlink/shared";

export const listMyPaymentsController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const pagination = parsePagination(request.nextUrl.searchParams);
  const { items, total } = await paymentsService.listMyPayments(authUser.userId, pagination);

  return okPaginated(
    "Payments fetched successfully.",
    items.map((payment) => toPaymentResponseDto(payment)),
    buildPaginationMeta(pagination, total)
  );
};
