import type { CreateAnnouncementDto, ListAnnouncementsQueryDto, UpdateAnnouncementDto } from "@/modules/announcements/dtos";
import { announcementsRepository } from "@/modules/announcements/repositories";
import type { AnnouncementModel } from "@/modules/announcements/types";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { NotFoundError } from "@petlink/shared";

const ANNOUNCEMENT_NOT_FOUND_MESSAGE = "Announcement not found.";

const ensureAuthorAccess = (announcement: AnnouncementModel, authUserId: string): void => {
  if (announcement.authorId !== authUserId) {
    throw new AppError("You do not have access to this announcement.", {
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: ERROR_CODES.FORBIDDEN
    });
  }
};

export const announcementsService = {
  createAnnouncement: (authUserId: string, payload: CreateAnnouncementDto): Promise<AnnouncementModel> => {
    return announcementsRepository.create(authUserId, payload);
  },

  listAnnouncements: (query: ListAnnouncementsQueryDto): Promise<AnnouncementModel[]> => {
    return announcementsRepository.findMany({
      ...query,
      isActive: query.isActive ?? true
    });
  },

  getAnnouncementById: async (id: string): Promise<AnnouncementModel> => {
    const announcement = await announcementsRepository.findById(id);

    if (!announcement) {
      throw new NotFoundError(ANNOUNCEMENT_NOT_FOUND_MESSAGE);
    }

    return announcement;
  },

  updateAnnouncementForAuthor: async (authUserId: string, announcementId: string, payload: UpdateAnnouncementDto): Promise<AnnouncementModel> => {
    const announcement = await announcementsService.getAnnouncementById(announcementId);
    ensureAuthorAccess(announcement, authUserId);
    return announcementsRepository.updateById(announcementId, payload);
  },

  deleteAnnouncementForAuthor: async (authUserId: string, announcementId: string): Promise<void> => {
    const announcement = await announcementsService.getAnnouncementById(announcementId);
    ensureAuthorAccess(announcement, authUserId);
    await announcementsRepository.deleteById(announcementId);
  }
};
