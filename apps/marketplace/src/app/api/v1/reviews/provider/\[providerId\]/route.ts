import { NextRequest } from "next/server";

import { listReviewsByProviderController } from "@/modules/reviews/controllers";
import { withErrorHandler } from "@petlink/shared";

type ProviderIdRouteParams = {
  params: {
    providerId: string;
  };
};

export async function GET(request: NextRequest, context: ProviderIdRouteParams) {
  return withErrorHandler(() => listReviewsByProviderController(request, context));
}