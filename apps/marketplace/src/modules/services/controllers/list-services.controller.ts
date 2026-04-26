import { NextRequest, NextResponse } from "next/server";

import { listServicesQuerySchema } from "@/modules/services/validators";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";
import { toServiceResponseDto } from "@/modules/services/dtos";
import { servicesService } from "@/modules/services/services";

export const listServicesController = async (request: NextRequest): Promise<NextResponse> => {
  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
  const validationResult = listServicesQuerySchema.safeParse(rawQuery);

  if (!validationResult.success) {
    throw new AppError("Invalid services filters.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const services = await servicesService.listServices(validationResult.data);

  return ok(
    "Services fetched successfully.",
    services.map((service) => {
      return toServiceResponseDto(service);
    })
  );
};