import { NextResponse } from "next/server";

import { marketplaceOpenApiDocument } from "@/lib/openapi";

export const dynamic = "force-static";

/** Serves the OpenAPI 3 document for the marketplace API. */
export function GET(): NextResponse {
  return NextResponse.json(marketplaceOpenApiDocument, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
