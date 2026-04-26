import { NextRequest } from "next/server";

import { createPetController, listMyPetsController } from "@/modules/pets/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => createPetController(request));
}

export async function GET(request: NextRequest) {
  return withErrorHandler(() => listMyPetsController(request));
}