import { NextResponse } from "next/server";

import { getAuthOpenApiSpec } from "@/lib/openapi";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(getAuthOpenApiSpec());
}
