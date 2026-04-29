import { supabaseAdminClient } from "@petlink/shared";
import type { UploadedMediaFile } from "@/modules/media/types";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";

const MEDIA_BUCKET = process.env.SUPABASE_STORAGE_MEDIA_BUCKET ?? "petlink-media";

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
};

const buildStoragePath = (folder: string, fileName: string): string => {
  const timestamp = Date.now();
  return `${folder}/${timestamp}-${sanitizeFileName(fileName)}`;
};

const isMissingBucketError = (message: string | undefined): boolean => {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes("bucket") && (lower.includes("not found") || lower.includes("does not exist"));
};

const ensureMediaBucketExists = async (): Promise<void> => {
  const { data: bucket, error: getError } = await supabaseAdminClient.storage.getBucket(MEDIA_BUCKET);

  if (!getError && bucket) {
    return;
  }

  const { error: createError } = await supabaseAdminClient.storage.createBucket(MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"]
  });

  if (createError && !String(createError.message).toLowerCase().includes("already exists")) {
    throw new AppError("Storage bucket is not available.", {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      details: createError.message
    });
  }
};

const uploadWithRetry = async (path: string, arrayBuffer: ArrayBuffer, contentType: string): Promise<void> => {
  const firstAttempt = await supabaseAdminClient.storage.from(MEDIA_BUCKET).upload(path, arrayBuffer, {
    contentType,
    upsert: false
  });

  if (!firstAttempt.error) {
    return;
  }

  if (!isMissingBucketError(firstAttempt.error.message)) {
    throw new AppError("Failed to upload file to storage.", {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      details: firstAttempt.error.message
    });
  }

  await ensureMediaBucketExists();

  const secondAttempt = await supabaseAdminClient.storage.from(MEDIA_BUCKET).upload(path, arrayBuffer, {
    contentType,
    upsert: false
  });

  if (secondAttempt.error) {
    throw new AppError("Failed to upload file to storage.", {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      details: secondAttempt.error.message
    });
  }
};

export const storageService = {
  uploadImage: async (file: File, folder: string): Promise<UploadedMediaFile> => {
    const fileName = sanitizeFileName(file.name || "image");
    const path = buildStoragePath(folder, fileName);
    const arrayBuffer = await file.arrayBuffer();

    await uploadWithRetry(path, arrayBuffer, file.type || "application/octet-stream");

    const {
      data: { publicUrl }
    } = supabaseAdminClient.storage.from(MEDIA_BUCKET).getPublicUrl(path);

    return {
      bucket: MEDIA_BUCKET,
      path,
      publicUrl,
      contentType: file.type,
      size: file.size,
      fileName
    };
  }
};