import { prisma } from "@petlink/database";
import type { Prisma } from "@prisma/client";
import type { CreateUserProfileDto, UpdateUserProfileDto } from "@/modules/users/dtos";
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

  if (payload.location !== undefined) {
    data.location = payload.location;
  }

  return data;
};

type UpsertFallback = {
  fullName: string;
  phone?: string | null;
  city?: string | null;
  location?: string | null;
  role?: import("@prisma/client").UserRole;
};

export const usersRepository = {
  create: (userId: string, data: CreateUserProfileDto): Promise<UserProfileModel> =>
    prisma.userProfile.create({
      data: {
        userId,
        fullName: data.fullName,
        phone: data.phone ?? null,
        city: data.city ?? null,
        location: data.location ?? null,
        role: data.role ?? "OWNER"
      }
    }),

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
  },

  upsertByAuthUserId: (userId: string, data: UpdateUserProfileDto, fallback: UpsertFallback): Promise<UserProfileModel> => {
    return prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: data.fullName ?? fallback.fullName,
        phone: data.phone ?? fallback.phone ?? null,
        city: data.city ?? fallback.city ?? null,
        location: data.location ?? fallback.location ?? null,
        role: fallback.role ?? "OWNER"
      },
      update: toUserProfileUpdateInput(data)
    });
  }
};