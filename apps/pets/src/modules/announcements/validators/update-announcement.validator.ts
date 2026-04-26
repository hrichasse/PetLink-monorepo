import { AnnouncementType } from "@prisma/client";
import { z } from "zod";

export const updateAnnouncementSchema = z
  .object({
    type: z.nativeEnum(AnnouncementType).optional(),
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().min(10).max(3000).optional(),
    imageUrl: z.union([z.string().url().max(500), z.null()]).optional(),
    contactPhone: z.union([z.string().trim().max(30), z.null()]).optional(),
    contactEmail: z.union([z.string().email().max(160), z.null()]).optional(),
    location: z.union([z.string().trim().max(200), z.null()]).optional(),
    city: z.union([z.string().trim().max(100), z.null()]).optional(),
    lat: z.union([z.number().min(-90).max(90), z.null()]).optional(),
    lng: z.union([z.number().min(-180).max(180), z.null()]).optional(),
    petId: z.union([z.string().uuid(), z.null()]).optional(),
    isActive: z.boolean().optional(),
    expiresAt: z.union([z.string().datetime(), z.null()]).optional()
  })
  .strict();
