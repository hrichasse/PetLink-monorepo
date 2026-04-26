import type { Prisma } from "@prisma/client";

import { prisma } from "@petlink/database";
import type { CreateAnnouncementDto, ListAnnouncementsQueryDto, UpdateAnnouncementDto } from "@/modules/announcements/dtos";
import type { AnnouncementModel } from "@/modules/announcements/types";

const toCreateInput = (authorId: string, payload: CreateAnnouncementDto): Prisma.AnnouncementCreateInput => {
  const data: Prisma.AnnouncementCreateInput = {
    author: { connect: { userId: authorId } },
    type: payload.type,
    title: payload.title,
    description: payload.description
  };

  if (payload.imageUrl !== undefined) {
    data.imageUrl = payload.imageUrl;
  }

  if (payload.contactPhone !== undefined) {
    data.contactPhone = payload.contactPhone;
  }

  if (payload.contactEmail !== undefined) {
    data.contactEmail = payload.contactEmail;
  }

  if (payload.location !== undefined) {
    data.location = payload.location;
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

  if (payload.petId !== undefined && payload.petId !== null) {
    data.pet = { connect: { id: payload.petId } };
  }

  if (payload.expiresAt !== undefined) {
    data.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  }

  return data;
};

const toUpdateInput = (payload: UpdateAnnouncementDto): Prisma.AnnouncementUpdateInput => {
  const data: Prisma.AnnouncementUpdateInput = {};

  if (payload.type !== undefined) {
    data.type = payload.type;
  }

  if (payload.title !== undefined) {
    data.title = payload.title;
  }

  if (payload.description !== undefined) {
    data.description = payload.description;
  }

  if (payload.imageUrl !== undefined) {
    data.imageUrl = payload.imageUrl;
  }

  if (payload.contactPhone !== undefined) {
    data.contactPhone = payload.contactPhone;
  }

  if (payload.contactEmail !== undefined) {
    data.contactEmail = payload.contactEmail;
  }

  if (payload.location !== undefined) {
    data.location = payload.location;
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

  if (payload.petId !== undefined) {
    data.pet = payload.petId ? { connect: { id: payload.petId } } : { disconnect: true };
  }

  if (payload.isActive !== undefined) {
    data.isActive = payload.isActive;
  }

  if (payload.expiresAt !== undefined) {
    data.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  }

  return data;
};

const toWhereInput = (query: ListAnnouncementsQueryDto): Prisma.AnnouncementWhereInput => {
  const where: Prisma.AnnouncementWhereInput = {};

  if (query.type !== undefined) {
    where.type = query.type;
  }

  if (query.city !== undefined) {
    where.city = { contains: query.city, mode: "insensitive" };
  }

  if (query.authorId !== undefined) {
    where.authorId = query.authorId;
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  return where;
};

export const announcementsRepository = {
  create: (authorId: string, payload: CreateAnnouncementDto): Promise<AnnouncementModel> => {
    return prisma.announcement.create({ data: toCreateInput(authorId, payload) });
  },

  findMany: (query: ListAnnouncementsQueryDto): Promise<AnnouncementModel[]> => {
    return prisma.announcement.findMany({
      where: toWhereInput(query),
      orderBy: { createdAt: "desc" }
    });
  },

  findById: (id: string): Promise<AnnouncementModel | null> => {
    return prisma.announcement.findUnique({ where: { id } });
  },

  updateById: (id: string, payload: UpdateAnnouncementDto): Promise<AnnouncementModel> => {
    return prisma.announcement.update({ where: { id }, data: toUpdateInput(payload) });
  },

  deleteById: (id: string): Promise<AnnouncementModel> => {
    return prisma.announcement.delete({ where: { id } });
  }
};
