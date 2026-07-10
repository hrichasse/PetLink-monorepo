import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { NotFoundError, HTTP_STATUS } from "@petlink/shared";

// Mock every heavy dependency the payments service imports so the suite stays
// isolated from the DB, the payment providers and the subscriptions chain.
jest.mock("../modules/payments/repositories", () => ({
  paymentsRepository: {
    findByIdForUser: jest.fn(),
    updateById: jest.fn(),
    findManyByUserId: jest.fn(),
  },
}));

jest.mock("../modules/payments/providers", () => ({ paymentProviderFactory: {} }));
jest.mock("../modules/subscriptions/repositories", () => ({ subscriptionsRepository: {} }));
jest.mock("../modules/subscriptions/services", () => ({
  subscriptionsService: {
    activateOrRefreshSubscriptionFromApprovedPayment: jest.fn(),
  },
}));

import { paymentsService } from "../modules/payments/services/payments.service";
import { paymentsRepository } from "../modules/payments/repositories";
import { subscriptionsService } from "../modules/subscriptions/services";

const mockRepo = paymentsRepository as jest.Mocked<typeof paymentsRepository>;
const mockSubs = subscriptionsService as jest.Mocked<typeof subscriptionsService>;

const USER_ID = "user-uuid";
const PAYMENT_ID = "payment-uuid";

const makePayment = (overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    id: PAYMENT_ID,
    userId: USER_ID,
    status: "PENDING",
    providerPaymentId: null,
    providerReference: null,
    metadata: null,
    ...overrides,
  }) as never;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("paymentsService.getPaymentByIdForUser()", () => {
  it("throws NotFound when the payment does not belong to the user (or is missing)", async () => {
    mockRepo.findByIdForUser.mockResolvedValueOnce(null as never);

    await expect(paymentsService.getPaymentByIdForUser(USER_ID, PAYMENT_ID)).rejects.toBeInstanceOf(NotFoundError);
    expect(mockRepo.findByIdForUser).toHaveBeenCalledWith(PAYMENT_ID, USER_ID);
  });

  it("returns the payment when found", async () => {
    const payment = makePayment();
    mockRepo.findByIdForUser.mockResolvedValueOnce(payment);

    await expect(paymentsService.getPaymentByIdForUser(USER_ID, PAYMENT_ID)).resolves.toBe(payment);
  });
});

describe("paymentsService.confirmPaymentForUser()", () => {
  it("rejects confirming a payment that is not pending", async () => {
    mockRepo.findByIdForUser.mockResolvedValueOnce(makePayment({ status: "APPROVED" }));

    await expect(
      paymentsService.confirmPaymentForUser(USER_ID, PAYMENT_ID, { status: "APPROVED" } as never)
    ).rejects.toMatchObject({ statusCode: HTTP_STATUS.CONFLICT });
    expect(mockRepo.updateById).not.toHaveBeenCalled();
  });

  it("activates the subscription when a pending payment is approved", async () => {
    mockRepo.findByIdForUser.mockResolvedValueOnce(makePayment({ status: "PENDING" }));
    mockRepo.updateById.mockResolvedValueOnce(makePayment({ status: "APPROVED" }));

    await paymentsService.confirmPaymentForUser(USER_ID, PAYMENT_ID, { status: "APPROVED" } as never);

    expect(mockRepo.updateById).toHaveBeenCalledTimes(1);
    expect(mockSubs.activateOrRefreshSubscriptionFromApprovedPayment).toHaveBeenCalledTimes(1);
  });

  it("does not touch the subscription when the payment is rejected", async () => {
    mockRepo.findByIdForUser.mockResolvedValueOnce(makePayment({ status: "PENDING" }));
    mockRepo.updateById.mockResolvedValueOnce(makePayment({ status: "REJECTED" }));

    await paymentsService.confirmPaymentForUser(USER_ID, PAYMENT_ID, { status: "REJECTED" } as never);

    expect(mockRepo.updateById).toHaveBeenCalledTimes(1);
    expect(mockSubs.activateOrRefreshSubscriptionFromApprovedPayment).not.toHaveBeenCalled();
  });
});
