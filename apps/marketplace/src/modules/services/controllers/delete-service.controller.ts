import { NextRequest, NextResponse } from "next/server";

import { serviceIdParamsSchema } from "@/modules/services/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { ok } from "@petlink/shared";
import { servicesService } from "@/modules/services/services";

type ServiceIdRouteParams = {
  params: {
    id: string;
  };
};

export const deleteServiceController = async (request: NextRequest, context: ServiceIdRouteParams): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const paramsValidation = serviceIdParamsSchema.safeParse(context.params);

  if (!paramsValidation.success) {
    throw new AppError("Invalid service id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: paramsValidation.error.flatten()
    });
  }

  await servicesService.deleteServiceForProvider(authUser.userId, paramsValidation.data.id);

  return ok("Service deleted successfully.", null);
};