import { AppError } from "../errors/app-error";
import { ERROR_CODES } from "../errors/error-codes";
import { HTTP_STATUS } from "../constants/http-status";
import type { HttpStatusCode } from "../constants/http-status";
import type { ApiResponse } from "../types/api";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type InternalFetchOptions = {
  url: string;
  method?: HttpMethod;
  /** Full "Authorization: Bearer <token>" header value forwarded from the original request. */
  authorizationHeader?: string;
  body?: unknown;
  timeoutMs?: number;
};

const toHttpStatusCode = (status: number): HttpStatusCode => {
  const known = Object.values(HTTP_STATUS) as number[];
  if (known.includes(status)) {
    return status as HttpStatusCode;
  }

  return HTTP_STATUS.INTERNAL_SERVER_ERROR;
};

/**
 * Typed HTTP client for internal app-to-app calls within the monorepo.
 * Parses the standard ApiResponse envelope and surfaces AppError on failure.
 * Applies a configurable timeout (default 10 s).
 */
export const internalFetch = async <TData>(options: InternalFetchOptions): Promise<TData> => {
  const { url, method = "GET", authorizationHeader, body, timeoutMs = 10_000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (authorizationHeader) {
    headers["Authorization"] = authorizationHeader;
  }

  let response: Response;

  try {
    const fetchInit: RequestInit = {
      method,
      headers,
      signal: controller.signal
    };

    if (body !== undefined) {
      fetchInit.body = JSON.stringify(body);
    }

    response = await fetch(url, fetchInit);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AppError(`Internal request timed out: ${url}`, {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: ERROR_CODES.INTERNAL_ERROR
      });
    }

    throw new AppError(`Internal request failed: ${url}`, {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      details: error instanceof Error ? error.message : String(error)
    });
  } finally {
    clearTimeout(timeoutId);
  }

  // Guard against upstream returning HTML (502, 504, reverse-proxy errors, etc.)
  let json: ApiResponse<TData>;
  try {
    json = (await response.json()) as ApiResponse<TData>;
  } catch {
    throw new AppError(
      `Internal service returned a non-JSON response (HTTP ${response.status}): ${url}`,
      {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: ERROR_CODES.INTERNAL_ERROR,
        details: { httpStatus: response.status, httpStatusText: response.statusText }
      }
    );
  }

  if (!json.success) {
    throw new AppError(json.message, {
      statusCode: toHttpStatusCode(response.status),
      code: json.errorCode,
      details: json.details
    });
  }

  return json.data;
};
