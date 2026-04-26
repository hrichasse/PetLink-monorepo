import { internalFetch } from "@petlink/shared";

/** Minimal pet fields needed by marketplace domain logic. */
export type PetSummary = {
  id: string;
  ownerId: string;
};

/**
 * Shape of the `data` field returned by GET /api/v1/pets/:id in apps/pets.
 * Mirrors PetResponseDto — defined locally to avoid cross-app import.
 */
type PetResponseData = {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  sex: string;
  description: string | null;
  isSterilized: boolean;
  isVaccinated: boolean;
  createdAt: string;
  updatedAt: string;
};

const PETS_API_BASE_URL =
  process.env["PETS_API_INTERNAL_URL"] ?? "http://localhost:3002/api/v1";

/**
 * Internal HTTP client for the pets app API.
 * Calls are forwarded with the original user's Bearer token so that
 * pets ownership rules are enforced by the pets domain.
 */
export const petsApiClient = {
  /**
   * Retrieves a pet by id on behalf of the authenticated user.
   * Throws NotFoundError (404) if the pet does not exist.
   * Throws AppError/403 if the pet does not belong to the user.
   * Both errors are propagated from the pets API response.
   */
  getPetById: async (authorizationHeader: string, petId: string): Promise<PetSummary> => {
    const data = await internalFetch<PetResponseData>({
      url: `${PETS_API_BASE_URL}/pets/${petId}`,
      authorizationHeader
    });

    return {
      id: data.id,
      ownerId: data.ownerId
    };
  }
};
