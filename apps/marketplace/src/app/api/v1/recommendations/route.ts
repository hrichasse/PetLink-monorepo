import { NextRequest } from "next/server";

import { withErrorHandler, getAuthContext, ok } from "@petlink/shared";
import { recommendationsEdgeService } from "@/modules/recommendations/services";
import type { RecommendationInput } from "@/modules/recommendations/types";

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const auth = await getAuthContext(request);
    const body = (await request.json()) as Omit<RecommendationInput, "userId">;
    const data = await recommendationsEdgeService.getRecommendations({
      userId: auth.userId,
      context: body.context,
      petId: body.petId,
      city: body.city,
      limit: body.limit,
      metadata: body.metadata
    });
    return ok("Recommendations retrieved.", data);
  });
}
