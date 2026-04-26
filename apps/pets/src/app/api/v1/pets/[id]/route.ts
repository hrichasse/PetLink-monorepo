import { NextRequest } from "next/server";

import { deletePetController, getPetByIdController, updatePetController } from "@/modules/pets/controllers";
import { withErrorHandler } from "@petlink/shared";

type PetIdRouteParams = {
  params: {
    id: string;
  };
};

export async function GET(request: NextRequest, context: PetIdRouteParams) {
  return withErrorHandler(() => getPetByIdController(request, context));
}

export async function PATCH(request: NextRequest, context: PetIdRouteParams) {
  return withErrorHandler(() => updatePetController(request, context));
}

export async function DELETE(request: NextRequest, context: PetIdRouteParams) {
  return withErrorHandler(() => deletePetController(request, context));
}