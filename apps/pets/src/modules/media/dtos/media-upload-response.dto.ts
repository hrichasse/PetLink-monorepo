import type { UploadedMediaFile } from "@/modules/media/types";

export type MediaUploadResponseDto = {
  bucket: string;
  path: string;
  url: string;
  contentType: string;
  size: number;
  fileName: string;
};

export const toMediaUploadResponseDto = (file: UploadedMediaFile): MediaUploadResponseDto => {
  return {
    bucket: file.bucket,
    path: file.path,
    url: file.publicUrl,
    contentType: file.contentType,
    size: file.size,
    fileName: file.fileName
  };
};