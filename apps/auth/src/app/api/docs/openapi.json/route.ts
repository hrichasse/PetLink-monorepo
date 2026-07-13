import { NextResponse } from "next/server";

import { authOpenApiDocument } from "@/lib/openapi";

export const dynamic = "force-static";

/** Serves the OpenAPI 3 document for the auth API. */
export function GET(): NextResponse {
  return NextResponse.json(authOpenApiDocument, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
