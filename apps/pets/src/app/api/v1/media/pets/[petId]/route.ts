import { NextRequest } from "next/server";

import { uploadPetImageController } from "@/modules/media/controllers";
import { withErrorHandler } from "@petlink/shared";

type PetIdRouteParams = {
  params: {
    petId: string;
  };
};

export async function POST(request: NextRequest, context: PetIdRouteParams) {
  return withErrorHandler(() => uploadPetImageController(request, context));
}