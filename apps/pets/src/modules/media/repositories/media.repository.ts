import type { Pet, PetImage, UserProfile } from "@prisma/client";

import { prisma } from "@petlink/database";

export const mediaRepository = {
  findPetById: (petId: string): Promise<Pet | null> => {
    return prisma.pet.findUnique({
      where: { id: petId }
    });
  },

  createPetImageReference: (petId: string, imageUrl: string, path: string): Promise<PetImage> => {
    return prisma.petImage.create({
      data: {
        petId,
        imageUrl,
        path
      }
    });
  },

  findUserProfileByAuthUserId: (userId: string): Promise<UserProfile | null> => {
    return prisma.userProfile.findUnique({
      where: { userId }
    });
  },

  updateUserAvatar: (userId: string, avatarUrl: string): Promise<UserProfile> => {
    return prisma.userProfile.update({
      where: { userId },
      data: {
        avatarUrl
      }
    });
  }
};