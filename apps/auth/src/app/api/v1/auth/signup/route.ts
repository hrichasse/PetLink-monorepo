import { NextRequest } from "next/server";
import { signupController } from "@/modules/users/controllers";
import { withErrorHandler, withRateLimit } from "@petlink/shared";

// Public, unauthenticated endpoint: throttle per IP to curb scripted mass
// registration and abuse. (Login is not handled here — it goes client→Supabase,
// which enforces its own rate limits.)
export async function POST(request: NextRequest) {
  return withErrorHandler(() =>
    withRateLimit(request, { bucket: "auth:signup", limit: 5, windowMs: 60_000 }, () =>
      signupController(request)
    )
  );
}
