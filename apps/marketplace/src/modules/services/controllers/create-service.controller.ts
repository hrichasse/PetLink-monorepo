import { NextRequest, NextResponse } from "next/server";

import { createServiceSchema } from "@/modules/services/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { created } from "@petlink/shared";
import { toServiceResponseDto } from "@/modules/services/dtos";
import { servicesService } from "@/modules/services/services";

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

export const createServiceController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);

  if (authUser.role !== "PROVIDER") {
    throw new AppError("Solo proveedores pueden crear servicios.", {
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: ERROR_CODES.FORBIDDEN
    });
  }

  const body = await parseBody(request);
  const validationResult = createServiceSchema.safeParse(body);

  if (!validationResult.success) {
    throw new AppError("Invalid create service payload.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const service = await servicesService.createService(authUser.userId, validationResult.data);

  return created("Service created successfully.", toServiceResponseDto(service));
};