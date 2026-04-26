export type RecommendationContext = "SERVICES" | "MATCH" | "HEALTH";

export type RecommendationInput = {
  userId: string;
  context: RecommendationContext;
  petId?: string | undefined;
  city?: string | undefined;
  limit?: number | undefined;
  metadata?: Record<string, unknown> | undefined;
};

export type RecommendationItem = {
  id: string;
  kind: "SERVICE" | "PET" | "HEALTH_ACTION" | "GENERIC";
  title: string;
  reason: string;
  score: number;
  metadata?: Record<string, unknown> | undefined;
};

export type RecommendationResponse = {
  generatedAt: string;
  context: RecommendationContext;
  items: RecommendationItem[];
};