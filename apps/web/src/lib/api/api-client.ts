import type { ApiResponse } from "./types";

/**
 * Error thrown by apiFetch when the API returns success: false.
 * Consumers can inspect `errorCode` and `status` to handle specific cases.
 */
export class ApiClientError extends Error {
  public constructor(
    message: string,
    public readonly errorCode: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

type FetchOptions = {
  token?: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

/**
 * Typed fetch wrapper for PetLink REST APIs.
 * Parses the standard { success, message, data } / { success, errorCode } envelope.
 * Throws ApiClientError on non-success responses.
 */
export const apiFetch = async <TData>(url: string, options: FetchOptions = {}): Promise<TData> => {
  const { token, method = "GET", body } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = { method, headers };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  const json = (await response.json()) as ApiResponse<TData>;

  if (!json.success) {
    throw new ApiClientError(json.message, json.errorCode, response.status, json.details);
  }

  return json.data;
};
