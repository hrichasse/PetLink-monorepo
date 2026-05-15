import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { AppError } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";

// Mock the repository before importing the service
jest.mock("../modules/subscriptions/repositories/subscriptions.repository", () => ({
  subscriptionsRepository: {
    findActiveByUserId: jest.fn(),
    findPendingByUserIdAndPlanCode: jest.fn(),
    findLatestManageableByUserIdAndPlanCode: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdForUser: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
  },
}));

jest.mock("../modules/payments/repositories", () => ({
  paymentsRepository: {
    cancelPendingBySubscriptionId: jest.fn(),
  },
}));

import { subscriptionsService } from "../modules/subscriptions/services/subscriptions.service";
import { subscriptionsRepository } from "../modules/subscriptions/repositories/subscriptions.repository";
import { paymentsRepository } from "../modules/payments/repositories";

const mockRepo = subscriptionsRepository as jest.Mocked<typeof subscriptionsRepository>;
const mockPaymentsRepo = paymentsRepository as jest.Mocked<typeof paymentsRepository>;

const BASE_SUBSCRIPTION = {
  id: "sub-uuid",
  userId: "user-uuid",
  planCode: "BASIC",
  status: "PENDING" as const,
  startDate: null,
  endDate: null,
  autoRenew: true,
  provider: null,
  externalCustomerId: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("subscriptionsService.createSubscription()", () => {
  it("throws VALIDATION_ERROR for an invalid plan code", async () => {
    await expect(
      subscriptionsService.createSubscription("user-uuid", {
        // Cast to bypass TypeScript — we intentionally test an invalid runtime value
        planCode: "FAKE_PLAN" as "BASIC",
        autoRenew: true,
      })
    ).rejects.toMatchObject({
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: "VALIDATION_ERROR",
    });
  });

  it("throws CONFLICT when user already has an active subscription for the same plan", async () => {
    mockRepo.findActiveByUserId.mockResolvedValueOnce({
      ...BASE_SUBSCRIPTION,
      planCode: "BASIC",
      status: "ACTIVE",
    });

    await expect(
      subscriptionsService.createSubscription("user-uuid", { planCode: "BASIC", autoRenew: true })
    ).rejects.toMatchObject({
      statusCode: HTTP_STATUS.CONFLICT,
      code: "CONFLICT",
    });
  });

  it("throws CONFLICT when user already has an active subscription for a different plan", async () => {
    mockRepo.findActiveByUserId.mockResolvedValueOnce({
      ...BASE_SUBSCRIPTION,
      planCode: "PREMIUM",
      status: "ACTIVE",
    });

    await expect(
      subscriptionsService.createSubscription("user-uuid", { planCode: "BASIC", autoRenew: true })
    ).rejects.toMatchObject({
      statusCode: HTTP_STATUS.CONFLICT,
      code: "CONFLICT",
    });
  });

  it("throws CONFLICT when user already has a pending subscription for the same plan", async () => {
    mockRepo.findActiveByUserId.mockResolvedValueOnce(null);
    mockRepo.findPendingByUserIdAndPlanCode.mockResolvedValueOnce(BASE_SUBSCRIPTION);

    await expect(
      subscriptionsService.createSubscription("user-uuid", { planCode: "BASIC", autoRenew: true })
    ).rejects.toMatchObject({
      statusCode: HTTP_STATUS.CONFLICT,
      code: "CONFLICT",
    });
  });

  it("creates subscription when no conflicts exist", async () => {
    mockRepo.findActiveByUserId.mockResolvedValueOnce(null);
    mockRepo.findPendingByUserIdAndPlanCode.mockResolvedValueOnce(null);
    mockRepo.create.mockResolvedValueOnce(BASE_SUBSCRIPTION);

    const result = await subscriptionsService.createSubscription("user-uuid", {
      planCode: "BASIC",
      autoRenew: true,
    });

    expect(result).toEqual(BASE_SUBSCRIPTION);
    expect(mockRepo.create).toHaveBeenCalledWith("user-uuid", { planCode: "BASIC", autoRenew: true });
  });
});

describe("subscriptionsService.getMyActiveSubscription()", () => {
  it("returns null when no active subscription exists", async () => {
    mockRepo.findActiveByUserId.mockResolvedValueOnce(null);

    const result = await subscriptionsService.getMyActiveSubscription("user-uuid");
    expect(result).toBeNull();
  });

  it("returns the active subscription when it exists", async () => {
    const active = { ...BASE_SUBSCRIPTION, status: "ACTIVE" as const };
    mockRepo.findActiveByUserId.mockResolvedValueOnce(active);

    const result = await subscriptionsService.getMyActiveSubscription("user-uuid");
    expect(result).toEqual(active);
  });
});

describe("subscriptionsService.cancelSubscriptionForUser()", () => {
  it("throws NotFoundError when subscription does not belong to user", async () => {
    mockRepo.findByIdForUser.mockResolvedValueOnce(null);

    await expect(
      subscriptionsService.cancelSubscriptionForUser("user-uuid", "sub-uuid")
    ).rejects.toMatchObject({
      statusCode: HTTP_STATUS.NOT_FOUND,
      code: "RESOURCE_NOT_FOUND",
    });
  });

  it("cancels pending payments, deletes the subscription and returns cancelled snapshot", async () => {
    const active = { ...BASE_SUBSCRIPTION, status: "ACTIVE" as const };
    const cancelled = {
      ...active,
      status: "CANCELLED" as const,
      autoRenew: false,
      endDate: new Date("2026-01-10"),
    };

    mockRepo.findByIdForUser.mockResolvedValueOnce(active);
    mockRepo.updateById.mockResolvedValueOnce(cancelled);
    mockPaymentsRepo.cancelPendingBySubscriptionId.mockResolvedValueOnce(1);
    mockRepo.deleteById.mockResolvedValueOnce(cancelled);

    const result = await subscriptionsService.cancelSubscriptionForUser("user-uuid", "sub-uuid");

    expect(mockRepo.updateById).toHaveBeenCalledWith(
      "sub-uuid",
      expect.objectContaining({ status: "CANCELLED", autoRenew: false })
    );
    expect(mockPaymentsRepo.cancelPendingBySubscriptionId).toHaveBeenCalledWith("sub-uuid");
    expect(mockRepo.deleteById).toHaveBeenCalledWith("sub-uuid");
    expect(result.status).toBe("CANCELLED");
  });
});
