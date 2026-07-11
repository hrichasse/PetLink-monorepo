import { AppError, ERROR_CODES, HTTP_STATUS } from "@petlink/shared";

import { subscriptionsService } from "@/modules/subscriptions/services";
import { getDailyAssistantLimit } from "@/modules/assistant/config/limits";
import { PET_ASSISTANT_SYSTEM_INSTRUCTION } from "@/modules/assistant/config/prompt";
import { assistantUsageRepository } from "@/modules/assistant/repositories";
import { generatePetAssistantReply, type ChatTurn } from "@/modules/assistant/providers/groq.client";

export type AssistantUsageSummary = {
  used: number;
  limit: number;
  remaining: number;
  planCode: string | null;
};

export type AssistantAnswer = AssistantUsageSummary & {
  answer: string;
};

/** UTC day key ('YYYY-MM-DD'), so quotas reset at UTC midnight without a job. */
const utcDayKey = (date: Date = new Date()): string => date.toISOString().slice(0, 10);

const resolvePlanAndLimit = async (
  authUserId: string
): Promise<{ planCode: string | null; limit: number }> => {
  const activeSubscription = await subscriptionsService.getMyActiveSubscription(authUserId);
  const planCode = activeSubscription?.planCode ?? null;
  return { planCode, limit: getDailyAssistantLimit(planCode) };
};

export const assistantService = {
  getUsage: async (authUserId: string): Promise<AssistantUsageSummary> => {
    const { planCode, limit } = await resolvePlanAndLimit(authUserId);
    const used = await assistantUsageRepository.getCountForDay(authUserId, utcDayKey());
    return { used, limit, remaining: Math.max(0, limit - used), planCode };
  },

  ask: async (authUserId: string, question: string, history: ChatTurn[]): Promise<AssistantAnswer> => {
    const { planCode, limit } = await resolvePlanAndLimit(authUserId);
    const day = utcDayKey();
    const used = await assistantUsageRepository.getCountForDay(authUserId, day);

    if (used >= limit) {
      throw new AppError("Alcanzaste tu límite diario de preguntas al asistente. Mejora tu plan para más.", {
        statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
        code: ERROR_CODES.RATE_LIMITED,
        details: { used, limit, planCode }
      });
    }

    // Only consume quota once the model actually answered — a failed upstream
    // call must not count against the user.
    const answer = await generatePetAssistantReply(PET_ASSISTANT_SYSTEM_INSTRUCTION, history, question);
    const newCount = await assistantUsageRepository.incrementForDay(authUserId, day);

    return {
      answer,
      used: newCount,
      limit,
      remaining: Math.max(0, limit - newCount),
      planCode
    };
  }
};
