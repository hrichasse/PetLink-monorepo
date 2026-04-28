export type ApiArea = "auth" | "pets" | "marketplace";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T }
  | { success: false; message?: string; error?: string; errorCode?: string; details?: unknown };

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isApiError<T>(payload: ApiEnvelope<T>): payload is { success: false; message?: string; error?: string; errorCode?: string; details?: unknown } {
  return payload.success === false;
}

const localBaseUrls: Record<ApiArea, string> = {
  auth: "http://localhost:3001/api/v1",
  pets: "http://localhost:3002/api/v1",
  marketplace: "http://localhost:3003/api/v1",
};

const publicBaseUrls: Record<ApiArea, string> = {
  auth: "https://petlink-auth.vercel.app/api/v1",
  pets: "https://petlink-pets.vercel.app/api/v1",
  marketplace: "https://petlink-marketplace.vercel.app/api/v1",
};

const configuredBaseUrls: Record<ApiArea, string | undefined> = {
  auth: process.env.NEXT_PUBLIC_AUTH_API_URL || (process.env.NODE_ENV === 'development' ? localBaseUrls.auth : publicBaseUrls.auth),
  pets: process.env.NEXT_PUBLIC_PETS_API_URL || (process.env.NODE_ENV === 'development' ? localBaseUrls.pets : publicBaseUrls.pets),
  marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || (process.env.NODE_ENV === 'development' ? localBaseUrls.marketplace : publicBaseUrls.marketplace),
};

const TOKEN_STORAGE_KEY = "petlink_access_token";

function getBaseUrl(area: ApiArea) {
  const configured = configuredBaseUrls[area];
  const isBrowserLocal = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (configured?.startsWith("http://localhost") && !isBrowserLocal) return publicBaseUrls[area];
  return configured;
}

export async function getAccessToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function apiRequest<T>(area: ApiArea, path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl(area);
  if (!baseUrl) throw new ApiError(`Falta configurar la URL pública de ${area}`, 0, "API_BASE_URL_MISSING");
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload) {
    const message = payload && isApiError(payload) ? payload.message ?? payload.error ?? "No se pudo completar la solicitud" : "No se pudo completar la solicitud";
    throw new ApiError(message, response.status, payload && isApiError(payload) ? payload.errorCode : undefined, payload && isApiError(payload) ? payload.details : undefined);
  }

  if (isApiError(payload)) throw new ApiError(payload.message ?? payload.error ?? "No se pudo completar la solicitud", response.status, payload.errorCode, payload.details);
  return payload.data;
}

export function asQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}
