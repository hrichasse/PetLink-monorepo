import { NextRequest } from "next/server";

import { createHealthRecordController } from "@/modules/health-records/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => createHealthRecordController(request));
}