import { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";
import { AppError } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";

// Mock Supabase clients before importing the controller
jest.mock("@petlink/shared", () => ({
  ...jest.requireActual("@petlink/shared"),
  getSupabaseAdminClient: jest.fn(),
  getSupabaseClient: jest.fn(),
}));

// Mock the users repository so no real DB calls are made
jest.mock("../modules/users/repositories", () => ({
  usersRepository: {
    findByAuthUserId: jest.fn(),
    create: jest.fn(),
  },
}));

// Mock toUserProfileResponseDto to return the profile as-is
jest.mock("../modules/users/dtos", () => ({
  toUserProfileResponseDto: jest.fn((p: unknown) => p),
}));

import { getSupabaseAdminClient, getSupabaseClient } from "@petlink/shared";
import { usersRepository } from "../modules/users/repositories";
import { signupController } from "../modules/users/controllers/signup.controller";

const mockGetAdminClient = getSupabaseAdminClient as jest.Mock;
const mockGetAnonClient = getSupabaseClient as jest.Mock;
const mockRepo = usersRepository as jest.Mocked<typeof usersRepository>;

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_PAYLOAD = {
  email: "test@example.com",
  password: "password123",
  fullName: "Test User",
  role: "OWNER",
};

const FAKE_PROFILE = {
  id: "profile-uuid",
  userId: "auth-uuid",
  fullName: "Test User",
  phone: null,
  avatarUrl: null,
  role: "OWNER" as UserRole,
  city: null,
  location: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const FAKE_SESSION = {
  access_token: "fake-access-token",
  refresh_token: "fake-refresh-token",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("signupController — validation", () => {
  it("throws AppError with VALIDATION_ERROR for invalid JSON", async () => {
    const req = new NextRequest("http://localhost/api/v1/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    await expect(signupController(req)).rejects.toThrow(AppError);
  });

  it("throws AppError with 422 for missing required fields", async () => {
    const req = makeRequest({ email: "bad" });

    await expect(signupController(req)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: "VALIDATION_ERROR",
    });
  });

  it("throws AppError for invalid role value", async () => {
    const req = makeRequest({ ...VALID_PAYLOAD, role: "INVALID_ROLE" });

    await expect(signupController(req)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("throws AppError for short password", async () => {
    const req = makeRequest({ ...VALID_PAYLOAD, password: "abc" });

    await expect(signupController(req)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });
});

describe("signupController — Supabase errors", () => {
  it("throws CONFLICT AppError when email is already registered", async () => {
    mockGetAdminClient.mockReturnValue({
      auth: {
        admin: {
          createUser: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "User already registered", code: "email_exists" },
          }),
        },
      },
    });

    const req = makeRequest(VALID_PAYLOAD);

    await expect(signupController(req)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.CONFLICT,
      code: "CONFLICT",
    });
  });

  it("throws AppError on generic Supabase createUser error", async () => {
    mockGetAdminClient.mockReturnValue({
      auth: {
        admin: {
          createUser: jest.fn().mockResolvedValue({
            data: null,
            error: { message: "Internal Supabase error", code: "internal" },
          }),
        },
      },
    });

    const req = makeRequest(VALID_PAYLOAD);

    await expect(signupController(req)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  });
});

describe("signupController — happy path", () => {
  it("returns 201 with session tokens and profile on success", async () => {
    mockGetAdminClient.mockReturnValue({
      auth: {
        admin: {
          createUser: jest.fn().mockResolvedValue({
            data: { user: { id: "auth-uuid" } },
            error: null,
          }),
        },
      },
    });

    mockGetAnonClient.mockReturnValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: {
            session: FAKE_SESSION,
            user: { id: "auth-uuid", email: "test@example.com" },
          },
          error: null,
        }),
      },
    });

    mockRepo.findByAuthUserId.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(FAKE_PROFILE);

    const req = makeRequest(VALID_PAYLOAD);
    const response = await signupController(req);
    const body = (await response.json()) as {
      success: boolean;
      data: { access_token: string; profile: { fullName: string } };
    };

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    expect(body.success).toBe(true);
    expect(body.data.access_token).toBe("fake-access-token");
    expect(body.data.profile).toMatchObject({ fullName: "Test User" });
  });
});
