import type { Prisma } from "@prisma/client";

import { prisma } from "@petlink/database";
import type { CreateServiceDto, ListServicesQueryDto, UpdateServiceDto } from "@/modules/services/dtos";
import type { ServiceModel } from "@/modules/services/types";

const toServiceCreateInput = (providerId: string, payload: CreateServiceDto): Prisma.ServiceCreateInput => {
  const data: Prisma.ServiceCreateInput = {
    provider: {
      connect: {
        userId: providerId
      }
    },
    type: payload.type,
    title: payload.title,
    description: payload.description,
    price: payload.price,
    location: payload.location,
    isActive: payload.isActive ?? true
  };

  if (payload.availabilityNotes !== undefined) {
    data.availabilityNotes = payload.availabilityNotes;
  }

  return data;
};

const toServiceUpdateInput = (payload: UpdateServiceDto): Prisma.ServiceUpdateInput => {
  const data: Prisma.ServiceUpdateInput = {};

  if (payload.type !== undefined) {
    data.type = payload.type;
  }

  if (payload.title !== undefined) {
    data.title = payload.title;
  }

  if (payload.description !== undefined) {
    data.description = payload.description;
  }

  if (payload.price !== undefined) {
    data.price = payload.price;
  }

  if (payload.location !== undefined) {
    data.location = payload.location;
  }

  if (payload.availabilityNotes !== undefined) {
    data.availabilityNotes = payload.availabilityNotes;
  }

  if (payload.isActive !== undefined) {
    data.isActive = payload.isActive;
  }

  return data;
};

const toWhereInput = (query: ListServicesQueryDto): Prisma.ServiceWhereInput => {
  const where: Prisma.ServiceWhereInput = {};

  if (query.type !== undefined) {
    where.type = query.type;
  }

  if (query.location !== undefined) {
    where.location = {
      contains: query.location,
      mode: "insensitive"
    };
  }

  if (query.providerId !== undefined) {
    where.providerId = query.providerId;
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  return where;
};

export const servicesRepository = {
  create: (providerId: string, payload: CreateServiceDto): Promise<ServiceModel> => {
    return prisma.service.create({
      data: toServiceCreateInput(providerId, payload)
    });
  },

  findMany: (query: ListServicesQueryDto): Promise<ServiceModel[]> => {
    return prisma.service.findMany({
      where: toWhereInput(query),
      orderBy: { createdAt: "desc" }
    });
  },

  findById: (id: string): Promise<ServiceModel | null> => {
    return prisma.service.findUnique({
      where: { id }
    });
  },

  updateById: (id: string, payload: UpdateServiceDto): Promise<ServiceModel> => {
    return prisma.service.update({
      where: { id },
      data: toServiceUpdateInput(payload)
    });
  },

  deleteById: (id: string): Promise<ServiceModel> => {
    return prisma.service.delete({
      where: { id }
    });
  }
};