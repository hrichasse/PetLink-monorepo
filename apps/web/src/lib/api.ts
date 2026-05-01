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
const REFRESH_TOKEN_STORAGE_KEY = "petlink_refresh_token";
const AUTH_REFRESH_TIMEOUT_MS = 5000;

const PETLINK_AUTH_URL = process.env.NEXT_PUBLIC_PETLINK_AUTH_URL || "https://nkwqzgbnzzitcnuboyto.supabase.co/auth/v1";
const PETLINK_AUTH_ANON_KEY = process.env.NEXT_PUBLIC_PETLINK_AUTH_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rd3F6Z2JuenppdGNudWJveXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTg5NTQsImV4cCI6MjA4OTI5NDk1NH0.Vc8s2lDTa8ygKzEi184WU4ZVCvg7L2b46KlK8I3YJOM";

let refreshInFlight: Promise<string | null> | null = null;

function getBaseUrl(area: ApiArea) {
  const configured = configuredBaseUrls[area];
  const isBrowserLocal = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (configured?.startsWith("http://localhost") && !isBrowserLocal) return publicBaseUrls[area];
  return configured;
}

export async function getAccessToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function clearRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function clearAuthTokens() {
  clearAccessToken();
  clearRefreshToken();
}

export async function refreshAccessToken() {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = await getRefreshToken();
  if (!refreshToken || !PETLINK_AUTH_ANON_KEY) return null;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${PETLINK_AUTH_URL}/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { apikey: PETLINK_AUTH_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: AbortSignal.timeout(AUTH_REFRESH_TIMEOUT_MS),
      });

      const data = await response.json().catch(() => null) as { access_token?: string; refresh_token?: string } | null;
      if (!response.ok || !data?.access_token) {
        clearAuthTokens();
        return null;
      }

      setAccessToken(data.access_token);
      if (data.refresh_token) setRefreshToken(data.refresh_token);
      return data.access_token;
    } catch {
      clearAuthTokens();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiRequest<T>(area: ApiArea, path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl(area);
  if (!baseUrl) throw new ApiError(`Falta configurar la URL pública de ${area}`, 0, "API_BASE_URL_MISSING");
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  if (response.status === 401) {
    const nextAccessToken = await refreshAccessToken();
    if (nextAccessToken) {
      headers.set("Authorization", `Bearer ${nextAccessToken}`);
      response = await fetch(`${baseUrl}${path}`, { ...init, headers });
    }
  }

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
