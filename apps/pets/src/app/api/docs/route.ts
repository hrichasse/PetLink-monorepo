import { NextResponse } from "next/server";

import { renderSwaggerHtml } from "@petlink/shared/lib/openapi";

export async function GET(): Promise<NextResponse> {
  return new NextResponse(renderSwaggerHtml("PetLink Pets API Docs", "/api/openapi"), {
    headers: {
      "content-type": "text/html; charset=utf-8"
    }
  });
}
