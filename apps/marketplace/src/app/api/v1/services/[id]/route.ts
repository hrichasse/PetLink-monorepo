import { NextRequest } from "next/server";

import { deleteServiceController, getServiceByIdController, updateServiceController } from "@/modules/services/controllers";
import { withErrorHandler } from "@petlink/shared";

type ServiceIdRouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_: NextRequest, context: ServiceIdRouteParams) {
  return withErrorHandler(() => getServiceByIdController(context));
}

export async function PATCH(request: NextRequest, context: ServiceIdRouteParams) {
  return withErrorHandler(() => updateServiceController(request, context));
}

export async function DELETE(request: NextRequest, context: ServiceIdRouteParams) {
  return withErrorHandler(() => deleteServiceController(request, context));
}
