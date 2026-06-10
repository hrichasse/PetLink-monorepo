import { NextResponse } from "next/server";

import { getMarketplaceOpenApiSpec } from "@/lib/openapi";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(getMarketplaceOpenApiSpec());
}
