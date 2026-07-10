import { petsService } from "../modules/pets/services/pets.service";
import { NotFoundError } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { Prisma } from "@prisma/client";
import type { PetModel } from "../modules/pets/types";

// Mock the repository so no real DB calls are made
jest.mock("../modules/pets/repositories/pets.repository", () => ({
  petsRepository: {
    create: jest.fn(),
    findManyByOwnerId: jest.fn(),
    findById: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
  },
}));

import { petsRepository } from "../modules/pets/repositories/pets.repository";

const mockRepo = petsRepository as jest.Mocked<typeof petsRepository>;

const OWNER_ID = "owner-auth-uuid";
const OTHER_USER_ID = "other-auth-uuid";
const PET_ID = "pet-uuid";

const FAKE_PET = {
  id: PET_ID,
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

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// createPet
// ─────────────────────────────────────────────
describe("petsService.createPet()", () => {
  it("delegates to the repository and returns the created pet", async () => {
    mockRepo.create.mockResolvedValueOnce(FAKE_PET);

    const result = await petsService.createPet(OWNER_ID, {
      name: "Firulais",
      species: "Perro",
      breed: "Labrador",
      age: 3,
      weight: 25,
      sex: "MALE",
      isSterilized: false,
      isVaccinated: true,
    });

    expect(result).toEqual(FAKE_PET);
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────
// listAuthenticatedUserPets
// ─────────────────────────────────────────────
describe("petsService.listAuthenticatedUserPets()", () => {
  const PAGINATION = { page: 1, pageSize: 20, skip: 0, take: 20 };

  it("returns the paginated pets for the authenticated user", async () => {
    mockRepo.findManyByOwnerId.mockResolvedValueOnce({ items: [FAKE_PET], total: 1 });

    const result = await petsService.listAuthenticatedUserPets(OWNER_ID, PAGINATION);

    expect(result).toEqual({ items: [FAKE_PET], total: 1 });
    expect(mockRepo.findManyByOwnerId).toHaveBeenCalledWith(OWNER_ID, PAGINATION);
  });

  it("returns an empty page when the user has no pets", async () => {
    mockRepo.findManyByOwnerId.mockResolvedValueOnce({ items: [], total: 0 });

    const result = await petsService.listAuthenticatedUserPets(OWNER_ID, PAGINATION);

    expect(result).toEqual({ items: [], total: 0 });
  });
});

// ─────────────────────────────────────────────
// getPetByIdForUser
// ─────────────────────────────────────────────
describe("petsService.getPetByIdForUser()", () => {
  it("returns the pet when it exists and belongs to the user", async () => {
    mockRepo.findById.mockResolvedValueOnce(FAKE_PET);

    const result = await petsService.getPetByIdForUser(OWNER_ID, PET_ID);

    expect(result).toEqual(FAKE_PET);
  });

  it("throws NotFoundError when the pet does not exist", async () => {
    mockRepo.findById.mockResolvedValueOnce(null);

    await expect(petsService.getPetByIdForUser(OWNER_ID, "missing-id")).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError with correct message", async () => {
    mockRepo.findById.mockResolvedValueOnce(null);

    await expect(petsService.getPetByIdForUser(OWNER_ID, "missing-id")).rejects.toThrow("Pet not found.");
  });

  it("throws FORBIDDEN AppError when pet belongs to a different user", async () => {
    mockRepo.findById.mockResolvedValueOnce(FAKE_PET);

    await expect(petsService.getPetByIdForUser(OTHER_USER_ID, PET_ID)).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });
});

// ─────────────────────────────────────────────
// updatePetForUser
// ─────────────────────────────────────────────
describe("petsService.updatePetForUser()", () => {
  it("updates and returns the pet when owner matches", async () => {
    const updated = { ...FAKE_PET, name: "Rex" };
    mockRepo.findById.mockResolvedValueOnce(FAKE_PET);
    mockRepo.updateById.mockResolvedValueOnce(updated);

    const result = await petsService.updatePetForUser(OWNER_ID, PET_ID, { name: "Rex" });

    expect(result.name).toBe("Rex");
    expect(mockRepo.updateById).toHaveBeenCalledWith(PET_ID, { name: "Rex" });
  });

  it("throws NotFoundError when pet does not exist", async () => {
    mockRepo.findById.mockResolvedValueOnce(null);

    await expect(petsService.updatePetForUser(OWNER_ID, "missing-id", { name: "Rex" })).rejects.toThrow(NotFoundError);
  });

  it("throws FORBIDDEN when pet belongs to a different user", async () => {
    mockRepo.findById.mockResolvedValueOnce(FAKE_PET);

    await expect(petsService.updatePetForUser(OTHER_USER_ID, PET_ID, { name: "Rex" })).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });
});

// ─────────────────────────────────────────────
// deletePetForUser
// ─────────────────────────────────────────────
describe("petsService.deletePetForUser()", () => {
  it("deletes the pet when owner matches", async () => {
    mockRepo.findById.mockResolvedValueOnce(FAKE_PET);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockRepo.deleteById as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

    await expect(petsService.deletePetForUser(OWNER_ID, PET_ID)).resolves.toBeUndefined();
    expect(mockRepo.deleteById).toHaveBeenCalledWith(PET_ID);
  });

  it("throws NotFoundError when pet does not exist", async () => {
    mockRepo.findById.mockResolvedValueOnce(null);

    await expect(petsService.deletePetForUser(OWNER_ID, "missing-id")).rejects.toThrow(NotFoundError);
  });

  it("throws FORBIDDEN when pet belongs to a different user", async () => {
    mockRepo.findById.mockResolvedValueOnce(FAKE_PET);

    await expect(petsService.deletePetForUser(OTHER_USER_ID, PET_ID)).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("throws CONFLICT AppError when pet has related bookings (Prisma P2003)", async () => {
    mockRepo.findById.mockResolvedValueOnce(FAKE_PET);

    const prismaError = new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
      code: "P2003",
      clientVersion: "6.0.0",
    });
    mockRepo.deleteById.mockRejectedValueOnce(prismaError);

    await expect(petsService.deletePetForUser(OWNER_ID, PET_ID)).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });
  });
});
