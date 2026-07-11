import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { HTTP_STATUS } from "@petlink/shared";

// Mock subscriptions (to avoid the DB chain), the usage repo and the Gemini
// client. The real limits config is used so the plan→quota mapping is exercised.
jest.mock("../modules/subscriptions/services", () => ({
  subscriptionsService: {
    getMyActiveSubscription: jest.fn(),
  },
}));

jest.mock("../modules/assistant/repositories", () => ({
  assistantUsageRepository: {
    getCountForDay: jest.fn(),
    incrementForDay: jest.fn(),
  },
}));

jest.mock("../modules/assistant/providers/gemini.client", () => ({
  generatePetAssistantReply: jest.fn(),
}));

import { assistantService } from "../modules/assistant/services/assistant.service";
import { subscriptionsService } from "../modules/subscriptions/services";
import { assistantUsageRepository } from "../modules/assistant/repositories";
import { generatePetAssistantReply } from "../modules/assistant/providers/gemini.client";

const mockSubs = subscriptionsService as jest.Mocked<typeof subscriptionsService>;
const mockRepo = assistantUsageRepository as jest.Mocked<typeof assistantUsageRepository>;
const mockGemini = generatePetAssistantReply as jest.MockedFunction<typeof generatePetAssistantReply>;

const USER_ID = "user-uuid";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("assistantService.getUsage()", () => {
  it("gives Free-tier limit (5) when there is no active subscription", async () => {
    mockSubs.getMyActiveSubscription.mockResolvedValueOnce(null);
    mockRepo.getCountForDay.mockResolvedValueOnce(2);

    const usage = await assistantService.getUsage(USER_ID);

    expect(usage).toEqual({ used: 2, limit: 5, remaining: 3, planCode: null });
  });

  it("maps the active plan to its quota (PREMIUM = 35)", async () => {
    mockSubs.getMyActiveSubscription.mockResolvedValueOnce({ planCode: "PREMIUM" } as never);
    mockRepo.getCountForDay.mockResolvedValueOnce(10);

    const usage = await assistantService.getUsage(USER_ID);

    expect(usage).toMatchObject({ limit: 35, remaining: 25, planCode: "PREMIUM" });
  });
});

describe("assistantService.ask()", () => {
  it("answers and consumes one question when under the limit", async () => {
    mockSubs.getMyActiveSubscription.mockResolvedValueOnce({ planCode: "BASIC" } as never);
    mockRepo.getCountForDay.mockResolvedValueOnce(4);
    mockGemini.mockResolvedValueOnce("Los perros necesitan paseos diarios.");
    mockRepo.incrementForDay.mockResolvedValueOnce(5);

    const result = await assistantService.ask(USER_ID, "¿Cuánto ejercicio necesita mi perro?", []);

    expect(mockGemini).toHaveBeenCalledTimes(1);
    expect(mockRepo.incrementForDay).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ answer: expect.stringContaining("paseos"), used: 5, limit: 15, remaining: 10 });
  });

  it("blocks with 429 and skips Gemini when the daily limit is reached", async () => {
    mockSubs.getMyActiveSubscription.mockResolvedValueOnce(null); // Free → limit 5
    mockRepo.getCountForDay.mockResolvedValueOnce(5);

    await expect(assistantService.ask(USER_ID, "¿Qué le doy de comer?", [])).rejects.toMatchObject({
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
    });
    expect(mockGemini).not.toHaveBeenCalled();
    expect(mockRepo.incrementForDay).not.toHaveBeenCalled();
  });

  it("does not consume quota when the model call fails", async () => {
    mockSubs.getMyActiveSubscription.mockResolvedValueOnce(null);
    mockRepo.getCountForDay.mockResolvedValueOnce(0);
    mockGemini.mockRejectedValueOnce(new Error("upstream down"));

    await expect(assistantService.ask(USER_ID, "¿Mi gato puede comer atún?", [])).rejects.toThrow("upstream down");
    expect(mockRepo.incrementForDay).not.toHaveBeenCalled();
  });
});
