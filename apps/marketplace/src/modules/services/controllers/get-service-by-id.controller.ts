import { NextResponse } from "next/server";

import { serviceIdParamsSchema } from "@/modules/services/validators";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";
import { toServiceResponseDto } from "@/modules/services/dtos";
import { servicesService } from "@/modules/services/services";

type ServiceIdRouteParams = {
  params: {
    id: string;
  };
};

export const getServiceByIdController = async ({ params }: ServiceIdRouteParams): Promise<NextResponse> => {
  const validationResult = serviceIdParamsSchema.safeParse(params);

  if (!validationResult.success) {
    throw new AppError("Invalid service id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const service = await servicesService.getServiceById(validationResult.data.id);

  return ok("Service fetched successfully.", toServiceResponseDto(service));
};