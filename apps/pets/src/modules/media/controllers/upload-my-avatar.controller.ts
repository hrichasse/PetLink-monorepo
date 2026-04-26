import { NextRequest, NextResponse } from "next/server";

import { toMediaUploadResponseDto } from "@/modules/media/dtos";
import { mediaService } from "@/modules/media/services";
import { mediaFileMetadataSchema } from "@/modules/media/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { created } from "@petlink/shared";

const extractFileFromFormData = async (request: NextRequest): Promise<File> => {
  const formData = await request.formData();
  const entry = formData.get("file");

  if (!(entry instanceof File)) {
    throw new AppError("Field 'file' is required and must be a file.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }

  const metadataValidation = mediaFileMetadataSchema.safeParse({
    fileName: entry.name,
    contentType: entry.type,
    size: entry.size
  });

  if (!metadataValidation.success) {
    throw new AppError("Invalid file metadata.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: metadataValidation.error.flatten()
    });
  }

  return entry;
};

export const uploadMyAvatarController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const file = await extractFileFromFormData(request);
  const uploaded = await mediaService.uploadMyAvatar(authUser.userId, file);

  return created("Avatar uploaded successfully.", toMediaUploadResponseDto(uploaded));
};