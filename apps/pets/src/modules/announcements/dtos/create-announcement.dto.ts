import type { AnnouncementType } from "@prisma/client";

export type CreateAnnouncementDto = {
  type: AnnouncementType;
  title: string;
  description: string;
  imageUrl?: string | null | undefined;
  contactPhone?: string | null | undefined;
  contactEmail?: string | null | undefined;
  location?: string | null | undefined;
  city?: string | null | undefined;
  lat?: number | null | undefined;
  lng?: number | null | undefined;
  petId?: string | null | undefined;
  expiresAt?: string | null | undefined;
};
