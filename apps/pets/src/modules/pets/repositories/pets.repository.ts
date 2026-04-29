import type { Prisma } from "@prisma/client";

import { prisma } from "@petlink/database";
import type { CreatePetDto, UpdatePetDto } from "@/modules/pets/dtos";
import type { PetModel } from "@/modules/pets/types";

const toPetUpdateInput = (payload: UpdatePetDto): Prisma.PetUpdateInput => {
  const data: Prisma.PetUpdateInput = {};

  if (payload.name !== undefined) {
    data.name = payload.name;
  }

  if (payload.species !== undefined) {
    data.species = payload.species;
  }

  if (payload.breed !== undefined) {
    data.breed = payload.breed;
  }

  if (payload.age !== undefined) {
    data.age = payload.age;
  }

  if (payload.weight !== undefined) {
    data.weight = payload.weight;
  }

  if (payload.sex !== undefined) {
    data.sex = payload.sex;
  }

  if (payload.description !== undefined) {
    data.description = payload.description;
  }

  if (payload.isSterilized !== undefined) {
    data.isSterilized = payload.isSterilized;
  }

  if (payload.isVaccinated !== undefined) {
    data.isVaccinated = payload.isVaccinated;
  }

  return data;
};

const toPetCreateInput = (ownerId: string, payload: CreatePetDto): Prisma.PetCreateInput => {
  const data: Prisma.PetCreateInput = {
    owner: {
      connect: {
        userId: ownerId
      }
    },
    name: payload.name,
    species: payload.species,
    breed: payload.breed,
    age: payload.age,
    weight: payload.weight,
    sex: payload.sex,
    isSterilized: payload.isSterilized,
    isVaccinated: payload.isVaccinated
  };

  if (payload.description !== undefined) {
    data.description = payload.description;
  }

  return data;
};

export const petsRepository = {
  create: (ownerId: string, payload: CreatePetDto): Promise<PetModel> => {
    return prisma.pet.create({
      data: toPetCreateInput(ownerId, payload),
      include: {
        images: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { imageUrl: true, createdAt: true }
        }
      }
    });
  },

  findManyByOwnerId: (ownerId: string): Promise<PetModel[]> => {
    return prisma.pet.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { imageUrl: true, createdAt: true }
        }
      }
    });
  },

  findById: (id: string): Promise<PetModel | null> => {
    return prisma.pet.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { imageUrl: true, createdAt: true }
        }
      }
    });
  },

  updateById: (id: string, payload: UpdatePetDto): Promise<PetModel> => {
    return prisma.pet.update({
      where: { id },
      data: toPetUpdateInput(payload),
      include: {
        images: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { imageUrl: true, createdAt: true }
        }
      }
    });
  },

  deleteById: (id: string): Promise<PetModel> => {
    return prisma.pet.delete({
      where: { id }
    });
  }
};