import type { UpdateUserProfileDto } from "@/modules/users/dtos";
import { usersRepository } from "@/modules/users/repositories";
import type { UserProfileModel } from "@/modules/users/types";
import { NotFoundError } from "@petlink/shared";

const USER_PROFILE_NOT_FOUND_MESSAGE = "User profile not found.";

export const usersService = {
  getAuthenticatedProfile: async (authUserId: string): Promise<UserProfileModel> => {
    const profile = await usersRepository.findByAuthUserId(authUserId);

    if (!profile) {
      throw new NotFoundError(USER_PROFILE_NOT_FOUND_MESSAGE);
    }

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