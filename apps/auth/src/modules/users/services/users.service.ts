import type { CreateUserProfileDto, UpdateUserProfileDto } from "@/modules/users/dtos";
import { usersRepository } from "@/modules/users/repositories";
import type { UserProfileModel } from "@/modules/users/types";
import { NotFoundError } from "@petlink/shared";

const USER_PROFILE_NOT_FOUND_MESSAGE = "User profile not found.";

export const usersService = {
  /**
   * Creates a UserProfile for the authenticated user if one does not exist.
   * Idempotent: returns the existing profile without modification if already present.
   * Returns { profile, isNew: true } on creation and { profile, isNew: false } when found.
   */
  createOrGetProfile: async (
    authUserId: string,
    payload: CreateUserProfileDto
  ): Promise<{ profile: UserProfileModel; isNew: boolean }> => {
    const existing = await usersRepository.findByAuthUserId(authUserId);
    if (existing) {
      return { profile: existing, isNew: false };
    }
    const profile = await usersRepository.create(authUserId, payload);
    return { profile, isNew: true };
  },

  getAuthenticatedProfile: async (authUserId: string): Promise<UserProfileModel> => {
    const profile = await usersRepository.findByAuthUserId(authUserId);

    if (!profile) {
      throw new NotFoundError(USER_PROFILE_NOT_FOUND_MESSAGE);
    }

    return profile;
  },

  ensureAuthenticatedProfile: async (authUserId: string, payload: CreateUserProfileDto): Promise<UserProfileModel> => {
    const { profile } = await usersService.createOrGetProfile(authUserId, payload);
    return profile;
  },

  updateAuthenticatedProfile: async (authUserId: string, payload: UpdateUserProfileDto): Promise<UserProfileModel> => {
    await usersService.getAuthenticatedProfile(authUserId);

    return usersRepository.updateByAuthUserId(authUserId, payload);
  },

  getProfileById: async (id: string): Promise<UserProfileModel> => {
    const profile = await usersRepository.findById(id);

    if (!profile) {
      throw new NotFoundError(USER_PROFILE_NOT_FOUND_MESSAGE);
    }

    return profile;
  }
};