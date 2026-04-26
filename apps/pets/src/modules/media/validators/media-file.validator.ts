import { z } from "zod";

export const MAX_MEDIA_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_MEDIA_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
] as const;

export const mediaFileMetadataSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum(ALLOWED_MEDIA_CONTENT_TYPES),
  size: z.number().int().positive().max(MAX_MEDIA_FILE_SIZE_BYTES)
});