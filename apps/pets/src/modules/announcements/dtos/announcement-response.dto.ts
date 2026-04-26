import type { AnnouncementType } from "@prisma/client";

import type { AnnouncementModel } from "@/modules/announcements/types";

export type AnnouncementResponseDto = {
  id: string;
  authorId: string;
  type: AnnouncementType;
  title: string;
  description: string;
  imageUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  location: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  petId: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const toAnnouncementResponseDto = (ann: AnnouncementModel): AnnouncementResponseDto => {
  return {
    id: ann.id,
    authorId: ann.authorId,
    type: ann.type,
    title: ann.title,
    description: ann.description,
    imageUrl: ann.imageUrl,
    contactPhone: ann.contactPhone,
    contactEmail: ann.contactEmail,
    location: ann.location,
    city: ann.city,
    lat: ann.lat ? Number(ann.lat) : null,
    lng: ann.lng ? Number(ann.lng) : null,
    petId: ann.petId,
    isActive: ann.isActive,
    expiresAt: ann.expiresAt ? ann.expiresAt.toISOString() : null,
    createdAt: ann.createdAt.toISOString(),
    updatedAt: ann.updatedAt.toISOString()
  };
};
