import { NextRequest } from "next/server";

import { deleteVeterinaryController, getVeterinaryByIdController, updateVeterinaryController } from "@/modules/veterinaries/controllers";
import { withErrorHandler } from "@petlink/shared";

type VeterinaryIdRouteParams = {
  params: {
    id: string;
  };
};

export async function GET(_: NextRequest, context: VeterinaryIdRouteParams) {
  return withErrorHandler(() => getVeterinaryByIdController(context));
}

export async function PATCH(request: NextRequest, context: VeterinaryIdRouteParams) {
  return withErrorHandler(() => updateVeterinaryController(request, context));
}

export async function DELETE(request: NextRequest, context: VeterinaryIdRouteParams) {
  return withErrorHandler(() => deleteVeterinaryController(request, context));
}
