import { NextResponse } from "next/server";

import { getPetsOpenApiSpec } from "@/lib/openapi";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(getPetsOpenApiSpec());
}
