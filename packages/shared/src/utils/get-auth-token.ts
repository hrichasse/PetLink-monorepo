import { UnauthorizedError } from "../errors/unauthorized-error";

const BEARER_PREFIX = "Bearer ";

export const getAuthToken = (authorizationHeader: string | null): string => {
  if (!authorizationHeader) {
    throw new UnauthorizedError("Authorization header is required.");
  }

  if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
    throw new UnauthorizedError("Authorization header must use Bearer token format.");
  }

  const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();

  if (!token) {
    throw new UnauthorizedError("Bearer token is missing.");
  }

  return token;
};
