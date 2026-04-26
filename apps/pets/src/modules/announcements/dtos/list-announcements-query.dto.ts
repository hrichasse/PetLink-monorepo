import type { AnnouncementType } from "@prisma/client";

export type ListAnnouncementsQueryDto = {
  type?: AnnouncementType | undefined;
  city?: string | undefined;
  authorId?: string | undefined;
  isActive?: boolean | undefined;
};
