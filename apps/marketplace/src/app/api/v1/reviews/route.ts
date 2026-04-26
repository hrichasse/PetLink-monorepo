import { NextRequest } from "next/server";

import { createReviewController } from "@/modules/reviews/controllers";
import { withErrorHandler } from "@petlink/shared";

export async function POST(request: NextRequest) {
  return withErrorHandler(() => createReviewController(request));
}