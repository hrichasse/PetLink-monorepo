export type UploadedMediaFile = {
  bucket: string;
  path: string;
  publicUrl: string;
  contentType: string;
  size: number;
  fileName: string;
};