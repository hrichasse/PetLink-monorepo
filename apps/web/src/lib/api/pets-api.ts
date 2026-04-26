import { apiFetch } from "./api-client";
import type { PetDto, PetSex } from "./types";

const BASE = process.env["NEXT_PUBLIC_PETS_API_URL"] ?? "http://localhost:3002/api/v1";

type CreatePetPayload = {
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  sex: PetSex;
  description?: string;
  isSterilized?: boolean;
  isVaccinated?: boolean;
};

type UpdatePetPayload = Partial<CreatePetPayload>;

export const petsApi = {
  /** GET /pets — Lists all pets owned by the authenticated user. */
  listMyPets: (token: string): Promise<PetDto[]> =>
    apiFetch<PetDto[]>(`${BASE}/pets`, { token }),

  /** GET /pets/:id — Returns a single pet owned by the authenticated user. */
  getPetById: (token: string, id: string): Promise<PetDto> =>
    apiFetch<PetDto>(`${BASE}/pets/${id}`, { token }),

  /** POST /pets — Creates a new pet for the authenticated user. */
  createPet: (token: string, payload: CreatePetPayload): Promise<PetDto> =>
    apiFetch<PetDto>(`${BASE}/pets`, { token, method: "POST", body: payload }),

  /** PATCH /pets/:id — Updates a pet owned by the authenticated user. */
  updatePet: (token: string, id: string, payload: UpdatePetPayload): Promise<PetDto> =>
    apiFetch<PetDto>(`${BASE}/pets/${id}`, { token, method: "PATCH", body: payload }),

  /** DELETE /pets/:id — Deletes a pet owned by the authenticated user. */
  deletePet: (token: string, id: string): Promise<void> =>
    apiFetch<void>(`${BASE}/pets/${id}`, { token, method: "DELETE" })
};
