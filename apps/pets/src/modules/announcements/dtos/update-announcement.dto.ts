import type { AnnouncementType } from "@prisma/client";

export type UpdateAnnouncementDto = {
  type?: AnnouncementType | undefined;
  title?: string | undefined;
  description?: string | undefined;
  imageUrl?: string | null | undefined;
  contactPhone?: string | null | undefined;
  contactEmail?: string | null | undefined;
  location?: string | null | undefined;
  city?: string | null | undefined;
  lat?: number | null | undefined;
  lng?: number | null | undefined;
  petId?: string | null | undefined;
  isActive?: boolean | undefined;
  expiresAt?: string | null | undefined;
};
