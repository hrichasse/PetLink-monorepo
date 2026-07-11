import { NextRequest, NextResponse } from "next/server";

import { requireAuth, ok, AppError, ERROR_CODES, HTTP_STATUS } from "@petlink/shared";

import { askAssistantSchema } from "@/modules/assistant/validators";
import { assistantService } from "@/modules/assistant/services";

const parseBody = async (request: NextRequest): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON.", {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: ERROR_CODES.VALIDATION_ERROR
    });
  }
};

export const askAssistantController = async (request: NextRequest): Promise<NextResponse> => {
  const authUser = await requireAuth(request);
  const body = await parseBody(request);
  const validationResult = askAssistantSchema.safeParse(body);

  if (!validationResult.success) {
    throw new AppError("Invalid assistant request.", {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: validationResult.error.flatten()
    });
  }

  const result = await assistantService.ask(
    authUser.userId,
    validationResult.data.question,
    validationResult.data.history
  );

  return ok("Respuesta generada.", result);
};
