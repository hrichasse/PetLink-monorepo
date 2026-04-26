import { NextRequest, NextResponse } from "next/server";

import { serviceIdParamsSchema, updateServiceSchema } from "@/modules/services/validators";
import { requireAuth } from "@petlink/shared";
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

const parseBody = async (request: NextRequest): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
};

export const updateServiceController = async (request: NextRequest, context: ServiceIdRouteParams): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const paramsValidation = serviceIdParamsSchema.safeParse(context.params);

  if (!paramsValidation.success) {
    throw new AppError("Invalid service id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: paramsValidation.error.flatten()
    });
  }

  const body = await parseBody(request);
  const bodyValidation = updateServiceSchema.safeParse(body);

  if (!bodyValidation.success) {
    throw new AppError("Invalid update service payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: bodyValidation.error.flatten()
    });
  }

  const service = await servicesService.updateServiceForProvider(authUser.userId, paramsValidation.data.id, bodyValidation.data);

  return ok("Service updated successfully.", toServiceResponseDto(service));
};