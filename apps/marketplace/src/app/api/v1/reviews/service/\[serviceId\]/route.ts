import { NextRequest } from "next/server";

import { listReviewsByServiceController } from "@/modules/reviews/controllers";
import { withErrorHandler } from "@petlink/shared";

type ServiceIdRouteParams = {
  params: {
    serviceId: string;
  };
};

export async function GET(request: NextRequest, context: ServiceIdRouteParams) {
  return withErrorHandler(() => listReviewsByServiceController(request, context));
}