import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CORS middleware for the pets API.
 * Required for cross-origin browser requests from apps/web (different Vercel domain).
 */
export function middleware(request: NextRequest): NextResponse {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*"
};
