import type { Prisma } from "@prisma/client";

import { prisma } from "@petlink/database";
import type { CreateVeterinaryDto, ListVeterinariesQueryDto, UpdateVeterinaryDto } from "@/modules/veterinaries/dtos";
import type { VeterinaryModel } from "@/modules/veterinaries/types";

const toCreateInput = (payload: CreateVeterinaryDto): Prisma.VeterinaryCreateInput => {
  const data: Prisma.VeterinaryCreateInput = {
    name: payload.name,
    address: payload.address,
    city: payload.city
  };

  if (payload.description !== undefined) {
    data.description = payload.description;
  }

  if (payload.phone !== undefined) {
    data.phone = payload.phone;
  }

  if (payload.email !== undefined) {
    data.email = payload.email;
  }

  if (payload.website !== undefined) {
    data.website = payload.website;
  }

  if (payload.lat !== undefined) {
    data.lat = payload.lat;
  }

  if (payload.lng !== undefined) {
    data.lng = payload.lng;
  }

  if (payload.specialties !== undefined) {
    data.specialties = payload.specialties;
  }

  if (payload.imageUrl !== undefined) {
    data.imageUrl = payload.imageUrl;
  }

  if (payload.isPartner !== undefined) {
    data.isPartner = payload.isPartner;
  }

  if (payload.isActive !== undefined) {
    data.isActive = payload.isActive;
  }

  if (payload.operatingHours !== undefined) {
    data.operatingHours = payload.operatingHours as Prisma.InputJsonValue;
  }

  return data;
};

const toUpdateInput = (payload: UpdateVeterinaryDto): Prisma.VeterinaryUpdateInput => {
  const data: Prisma.VeterinaryUpdateInput = {};

  if (payload.name !== undefined) {
    data.name = payload.name;
  }

  if (payload.description !== undefined) {
    data.description = payload.description;
  }

  if (payload.phone !== undefined) {
    data.phone = payload.phone;
  }

  if (payload.email !== undefined) {
    data.email = payload.email;
  }

  if (payload.website !== undefined) {
    data.website = payload.website;
  }

  if (payload.address !== undefined) {
    data.address = payload.address;
  }

  if (payload.city !== undefined) {
    data.city = payload.city;
  }

  if (payload.lat !== undefined) {
    data.lat = payload.lat;
  }

  if (payload.lng !== undefined) {
    data.lng = payload.lng;
  }

  if (payload.specialties !== undefined) {
    data.specialties = payload.specialties;
  }

  if (payload.imageUrl !== undefined) {
    data.imageUrl = payload.imageUrl;
  }

  if (payload.isPartner !== undefined) {
    data.isPartner = payload.isPartner;
  }

  if (payload.isActive !== undefined) {
    data.isActive = payload.isActive;
  }

  if (payload.operatingHours !== undefined) {
    data.operatingHours = payload.operatingHours as Prisma.InputJsonValue;
  }

  return data;
};

const toWhereInput = (query: ListVeterinariesQueryDto): Prisma.VeterinaryWhereInput => {
  const where: Prisma.VeterinaryWhereInput = {};

  if (query.city !== undefined) {
    where.city = { contains: query.city, mode: "insensitive" };
  }

  if (query.specialty !== undefined) {
    where.specialties = { has: query.specialty };
  }

  if (query.isPartner !== undefined) {
    where.isPartner = query.isPartner;
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  return where;
};

export const veterinariesRepository = {
  create: (payload: CreateVeterinaryDto): Promise<VeterinaryModel> => {
    return prisma.veterinary.create({ data: toCreateInput(payload) });
  },

  findMany: (query: ListVeterinariesQueryDto): Promise<VeterinaryModel[]> => {
    return prisma.veterinary.findMany({
      where: toWhereInput(query),
      orderBy: { createdAt: "desc" }
    });
  },

  findById: (id: string): Promise<VeterinaryModel | null> => {
    return prisma.veterinary.findUnique({ where: { id } });
  },

  updateById: (id: string, payload: UpdateVeterinaryDto): Promise<VeterinaryModel> => {
    return prisma.veterinary.update({ where: { id }, data: toUpdateInput(payload) });
  },

  deleteById: (id: string): Promise<VeterinaryModel> => {
    return prisma.veterinary.delete({ where: { id } });
  }
};
