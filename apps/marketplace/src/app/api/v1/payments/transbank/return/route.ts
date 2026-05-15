import { NextRequest } from "next/server";

import { transbankReturnController } from "@/modules/payments/controllers/transbank-return.controller";

export async function GET(request: NextRequest) {
  return transbankReturnController(request);
}

export async function POST(request: NextRequest) {
  return transbankReturnController(request);
}
