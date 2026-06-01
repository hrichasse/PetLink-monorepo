import { NextRequest } from "next/server";
import { AppError } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";

// Mock Supabase clients before importing the controller
jest.mock("@petlink/shared", () => ({
  ...jest.requireActual("@petlink/shared"),
  getSupabaseAdminClient: jest.fn(),
  getSupabaseClient: jest.fn(),
  requireAuth: jest.fn(),
}));

// Mock the pets repository so no real DB calls are made
jest.mock("../modules/pets/repositories/pets.repository", () => ({
  petsRepository: {
    create: jest.fn(),
    findManyByOwnerId: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
  },
}));

// Mock toPetResponseDto to return the pet as-is
jest.mock("../modules/pets/dtos", () => ({
  toPetResponseDto: jest.fn((p: unknown) => p),
}));

import { requireAuth } from "@petlink/shared";
import { petsRepository } from "../modules/pets/repositories/pets.repository";
import { createPetController } from "../modules/pets/controllers/create-pet.controller";
import { Prisma } from "@prisma/client";
import type { PetModel } from "../modules/pets/types";

const mockRequireAuth = requireAuth as jest.Mock;
const mockRepo = petsRepository as jest.Mocked<typeof petsRepository>;

const OWNER_ID = "owner-auth-uuid";

const FAKE_PET = {
  id: "pet-uuid",
  ownerId: OWNER_ID,
  name: "Firulais",
  species: "Perro",
  breed: "Labrador",
  age: 3,
  weight: new Prisma.Decimal(25),
  sex: "MALE" as const,
  description: null,
  isSterilized: false,
  isVaccinated: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  images: [],
} as unknown as PetModel;

const VALID_PAYLOAD = {
  name: "Firulais",
  species: "Perro",
  breed: "Labrador",
  age: 3,
  weight: 25,
  sex: "MALE",
  isSterilized: false,
  isVaccinated: true,
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/v1/pets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ userId: OWNER_ID });
});

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────
describe("createPetController — validation", () => {
  it("throws AppError with VALIDATION_ERROR for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/v1/pets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    await expect(createPetController(req)).rejects.toThrow(AppError);
  });

  it("throws 422 VALIDATION_ERROR for missing required fields", async () => {
    const req = makeRequest({ name: "Firulais" });

    await expect(createPetController(req)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: "VALIDATION_ERROR",
    });
  });

  it("throws 422 VALIDATION_ERROR for invalid sex value", async () => {
    const req = makeRequest({ ...VALID_PAYLOAD, sex: "UNKNOWN" });

    await expect(createPetController(req)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: "VALIDATION_ERROR",
    });
  });

  it("throws 422 VALIDATION_ERROR for negative age", async () => {
    const req = makeRequest({ ...VALID_PAYLOAD, age: -1 });

    await expect(createPetController(req)).rejects.toMatchObject({
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: "VALIDATION_ERROR",
    });
  });
});

// ─────────────────────────────────────────────
// Success
// ─────────────────────────────────────────────
describe("createPetController — success", () => {
  it("returns 201 with the created pet on valid payload", async () => {
    mockRepo.create.mockResolvedValueOnce(FAKE_PET);

    const req = makeRequest(VALID_PAYLOAD);
    const response = await createPetController(req);

    expect(response.status).toBe(HTTP_STATUS.CREATED);
    expect(mockRepo.create).toHaveBeenCalledWith(OWNER_ID, expect.objectContaining({ name: "Firulais" }));
  });

  it("calls requireAuth before processing the request", async () => {
    mockRepo.create.mockResolvedValueOnce(FAKE_PET);

    const req = makeRequest(VALID_PAYLOAD);
    await createPetController(req);

    expect(mockRequireAuth).toHaveBeenCalledTimes(1);
  });
});
