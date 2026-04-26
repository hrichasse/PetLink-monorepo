import { apiFetch } from "./api-client";
import type { UserProfileDto } from "./types";

const BASE = process.env["NEXT_PUBLIC_AUTH_API_URL"] ?? "http://localhost:3001/api/v1";

type UpdateProfilePayload = {
  fullName?: string;
  phone?: string;
  city?: string;
};

type CreateProfilePayload = {
  fullName: string;
  phone?: string;
  city?: string;
};

export const authApi = {
  /**
   * POST /users — Idempotent: creates a UserProfile if it doesn't exist.
   * Returns 201 (new) or 200 (existing). Safe to call unconditionally after login.
   * fullName is required; use email-prefix as default if no name is known yet.
   */
  createProfile: (token: string, payload: CreateProfilePayload): Promise<UserProfileDto> =>
    apiFetch<UserProfileDto>(`${BASE}/users`, { token, method: "POST", body: payload }),

  /** GET /users/me — Returns the authenticated user's profile. */
  getMe: (token: string): Promise<UserProfileDto> =>
    apiFetch<UserProfileDto>(`${BASE}/users/me`, { token }),

  /** PATCH /users/me — Updates fullName, phone, or city. */
  updateMe: (token: string, payload: UpdateProfilePayload): Promise<UserProfileDto> =>
    apiFetch<UserProfileDto>(`${BASE}/users/me`, { token, method: "PATCH", body: payload }),

  /** GET /users/:id — Returns a public user profile by id. */
  getUserById: (token: string, id: string): Promise<UserProfileDto> =>
    apiFetch<UserProfileDto>(`${BASE}/users/${id}`, { token })
};
