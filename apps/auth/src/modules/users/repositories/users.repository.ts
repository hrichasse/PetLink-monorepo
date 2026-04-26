import { prisma } from "@petlink/database";
import type { Prisma } from "@prisma/client";
import type { UpdateUserProfileDto } from "@/modules/users/dtos";
import type { UserProfileModel } from "@/modules/users/types";

const toUserProfileUpdateInput = (payload: UpdateUserProfileDto): Prisma.UserProfileUpdateInput => {
  const data: Prisma.UserProfileUpdateInput = {};

  if (payload.fullName !== undefined) {
    data.fullName = payload.fullName;
  }

  if (payload.phone !== undefined) {
    data.phone = payload.phone;
  }

  if (payload.city !== undefined) {
    data.city = payload.city;
  }

  return data;
};

export const usersRepository = {
  findByAuthUserId: (userId: string): Promise<UserProfileModel | null> => {
    return prisma.userProfile.findUnique({
      where: { userId }
    });
  },

  findById: (id: string): Promise<UserProfileModel | null> => {
    return prisma.userProfile.findUnique({
      where: { id }
    });
  },

  updateByAuthUserId: (userId: string, data: UpdateUserProfileDto): Promise<UserProfileModel> => {
    return prisma.userProfile.update({
      where: { userId },
      data: toUserProfileUpdateInput(data)
    });
  }
};