import { invokeEdgeFunction } from "@petlink/shared";
import type { RecommendationInput, RecommendationResponse } from "@/modules/recommendations/types";

const RECOMMENDATIONS_FUNCTION_NAME = "recommendations";

export const recommendationsEdgeService = {
  getRecommendations: (payload: RecommendationInput): Promise<RecommendationResponse> => {
    return invokeEdgeFunction<RecommendationInput, RecommendationResponse>({
      functionName: RECOMMENDATIONS_FUNCTION_NAME,
      payload
    });
  }
};