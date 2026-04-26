import { NextRequest, NextResponse } from "next/server";

import { toMediaUploadResponseDto } from "@/modules/media/dtos";
import { mediaService } from "@/modules/media/services";
import { mediaFileMetadataSchema, petIdParamsSchema } from "@/modules/media/validators";
import { requireAuth } from "@petlink/shared";
import { HTTP_STATUS } from "@petlink/shared";
import { AppError } from "@petlink/shared";
import { ERROR_CODES } from "@petlink/shared";
import { created } from "@petlink/shared";

type PetIdRouteParams = {
  params: {
    petId: string;
  };
};

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

export const uploadPetImageController = async (
  request: NextRequest,
  context: PetIdRouteParams
): Promise<NextResponse> => {
  const authUser = await requireAuth(request);

  const paramsValidation = petIdParamsSchema.safeParse(context.params);

  if (!paramsValidation.success) {
    throw new AppError("Invalid pet id.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: paramsValidation.error.flatten()
    });
  }

  const file = await extractFileFromFormData(request);
  const uploaded = await mediaService.uploadPetImage(authUser.userId, paramsValidation.data.petId, file);

  return created("Pet image uploaded successfully.", toMediaUploadResponseDto(uploaded));
};