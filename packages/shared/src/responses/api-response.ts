import { NextResponse } from "next/server";

import { HTTP_STATUS } from "../constants/http-status";
import type { ErrorCode } from "../errors/error-codes";
import type { ApiError, ApiPaginatedSuccess, ApiSuccess } from "../types/api";
import type { PaginationMeta } from "../utils/pagination";

type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

export const ok = <TData>(
  message: string,
  data: TData,
  status: HttpStatusCode = HTTP_STATUS.OK
): NextResponse<ApiSuccess<TData>> => {
  return NextResponse.json(
    {
      success: true,
      message,
      data
    },
    { status }
  );
};

export const created = <TData>(message: string, data: TData): NextResponse<ApiSuccess<TData>> => {
  return ok(message, data, HTTP_STATUS.CREATED);
};

export const okPaginated = <TItem>(
  message: string,
  items: TItem[],
  meta: PaginationMeta
): NextResponse<ApiPaginatedSuccess<TItem>> => {
  return NextResponse.json(
    {
      success: true,
      message,
      data: items,
      meta
    },
    { status: HTTP_STATUS.OK }
  );
};

/**
 * Cache-Control for PUBLIC, non-personalized list endpoints. `s-maxage` lets a
 * shared CDN (Vercel) serve a cached copy for 60s; `stale-while-revalidate`
 * keeps serving a slightly stale copy for up to 5 more minutes while it
 * refreshes in the background.
 *
 * Only apply to responses with no per-user data. Note that Vercel's CDN skips
 * caching for requests carrying an `Authorization` header, so this mainly
 * accelerates logged-out traffic (e.g. the landing page) and lowers DB load.
 */
export const PUBLIC_LIST_CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=300";

export const withPublicCache = <T>(response: NextResponse<T>): NextResponse<T> => {
  response.headers.set("Cache-Control", PUBLIC_LIST_CACHE_CONTROL);
  return response;
};

export const fail = (
  message: string,
  errorCode: ErrorCode,
  details?: unknown,
  status: HttpStatusCode = HTTP_STATUS.BAD_REQUEST
): NextResponse<ApiError> => {
  return NextResponse.json(
    {
      success: false,
      message,
      errorCode,
      details
    },
    { status }
  );
};
