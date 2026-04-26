import { NextRequest } from "next/server";

import { listHealthRecordsByPetController } from "@/modules/health-records/controllers";
import { withErrorHandler } from "@petlink/shared";

type PetIdRouteParams = {
  params: {
    petId: string;
  };
};

export async function GET(request: NextRequest, context: PetIdRouteParams) {
  return withErrorHandler(() => listHealthRecordsByPetController(request, context));
}