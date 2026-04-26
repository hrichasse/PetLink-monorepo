import { NextRequest } from "next/server";

import { createVeterinaryController, listVeterinariesController } from "@/modules/veterinaries/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => createVeterinaryController(request));
}

export async function GET(request: NextRequest) {
  return withErrorHandler(() => listVeterinariesController(request));
}
