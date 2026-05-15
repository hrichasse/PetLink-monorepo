import { usersService } from "../modules/users/services/users.service";
import { NotFoundError } from "@petlink/shared";

// Mock the repository so no real DB calls are made
jest.mock("../modules/users/repositories/users.repository", () => ({
  usersRepository: {
    findByAuthUserId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateByAuthUserId: jest.fn(),
    upsertByAuthUserId: jest.fn(),
  },
}));

// Re-import after mock
import { usersRepository } from "../modules/users/repositories/users.repository";

const mockRepo = usersRepository as jest.Mocked<typeof usersRepository>;

const FAKE_PROFILE = {
  id: "profile-uuid",
  userId: "auth-uuid",
  fullName: "Test User",
  phone: null,
  avatarUrl: null,
  role: "OWNER" as const,
  city: null,
  location: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("usersService.createOrGetProfile()", () => {
  it("returns existing profile without creating a new one", async () => {
    mockRepo.findByAuthUserId.mockResolvedValueOnce(FAKE_PROFILE);

    const result = await usersService.createOrGetProfile("auth-uuid", {
      fullName: "Test User",
      role: "OWNER",
    });

    expect(result.isNew).toBe(false);
    expect(result.profile).toEqual(FAKE_PROFILE);
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("creates a new profile when none exists", async () => {
    mockRepo.findByAuthUserId.mockResolvedValueOnce(null);
    mockRepo.create.mockResolvedValueOnce(FAKE_PROFILE);

    const result = await usersService.createOrGetProfile("auth-uuid", {
      fullName: "Test User",
      role: "OWNER",
    });

    expect(result.isNew).toBe(true);
    expect(mockRepo.create).toHaveBeenCalledWith("auth-uuid", { fullName: "Test User", role: "OWNER" });
  });
});

describe("usersService.getAuthenticatedProfile()", () => {
  it("returns the profile when it exists", async () => {
    mockRepo.findByAuthUserId.mockResolvedValueOnce(FAKE_PROFILE);

    const profile = await usersService.getAuthenticatedProfile("auth-uuid");

    expect(profile).toEqual(FAKE_PROFILE);
  });

  it("throws NotFoundError when profile does not exist", async () => {
    mockRepo.findByAuthUserId.mockResolvedValueOnce(null);

    await expect(usersService.getAuthenticatedProfile("missing-uuid")).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError with correct message", async () => {
    mockRepo.findByAuthUserId.mockResolvedValueOnce(null);

    await expect(usersService.getAuthenticatedProfile("missing-uuid")).rejects.toThrow("User profile not found.");
  });
});

describe("usersService.updateAuthenticatedProfile()", () => {
  it("calls update after confirming the profile exists", async () => {
    mockRepo.findByAuthUserId.mockResolvedValueOnce(FAKE_PROFILE);
    mockRepo.updateByAuthUserId.mockResolvedValueOnce({ ...FAKE_PROFILE, fullName: "Updated" });

    const result = await usersService.updateAuthenticatedProfile("auth-uuid", { fullName: "Updated" });

    expect(result.fullName).toBe("Updated");
    expect(mockRepo.updateByAuthUserId).toHaveBeenCalledWith("auth-uuid", { fullName: "Updated" });
  });

  it("throws NotFoundError if profile does not exist before update", async () => {
    mockRepo.findByAuthUserId.mockResolvedValueOnce(null);

    await expect(
      usersService.updateAuthenticatedProfile("missing-uuid", { fullName: "X" })
    ).rejects.toThrow(NotFoundError);
  });
});
