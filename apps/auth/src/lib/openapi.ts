import path from "node:path";

import { buildOpenApiSpec, type OpenApiOverrides } from "@petlink/shared/lib/openapi";

// ─── Reusable schemas ────────────────────────────────────────────────────────

const errorResponse = (message: string, errorCode: string) => ({
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string", example: message },
    errorCode: { type: "string", example: errorCode },
    details: { type: ["object", "null"], additionalProperties: true }
  },
  required: ["success", "message", "errorCode"],
  additionalProperties: false
});

const successResponse = (message: string, dataSchema: Record<string, unknown>) => ({
  type: "object",
  properties: {
    success: { type: "boolean", example: true },
    message: { type: "string", example: message },
    data: dataSchema
  },
  required: ["success", "message", "data"],
  additionalProperties: false
});

const standardErrors = {
  "400": { description: "Invalid JSON body.", content: { "application/json": { schema: errorResponse("Request body must be valid JSON.", "VALIDATION_ERROR") } } },
  "401": { description: "Missing or invalid Authorization header.", content: { "application/json": { schema: errorResponse("Authorization header is required.", "UNAUTHORIZED") } } },
  "403": { description: "Access denied.", content: { "application/json": { schema: errorResponse("You do not have access to this resource.", "FORBIDDEN") } } },
  "404": { description: "Resource not found.", content: { "application/json": { schema: errorResponse("User profile not found.", "RESOURCE_NOT_FOUND") } } },
  "422": { description: "Validation error.", content: { "application/json": { schema: errorResponse("Invalid payload.", "VALIDATION_ERROR") } } },
  "500": { description: "Internal server error.", content: { "application/json": { schema: errorResponse("Internal server error.", "INTERNAL_ERROR") } } }
};

const userProfileSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    fullName: { type: "string", example: "María Pérez" },
    phone: { type: "string", nullable: true, example: "+56912345678" },
    avatarUrl: { type: "string", nullable: true },
    role: { type: "string", enum: ["OWNER", "PROVIDER", "ADMIN"] },
    city: { type: "string", nullable: true, example: "Santiago" },
    location: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "userId", "fullName", "phone", "avatarUrl", "role", "city", "location", "createdAt", "updatedAt"],
  additionalProperties: false
};

// ─── Overrides ───────────────────────────────────────────────────────────────

const authOverrides: OpenApiOverrides = {
  // ── Status & health ────────────────────────────────────────────────────────
  "GET /api/v1": {
    summary: "Auth service status",
    description: "Returns a basic status payload for the Auth API.",
    security: [],
    responses: {
      "200": {
        description: "Auth API status.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string", example: "PetLink auth API" },
                version: { type: "string", example: "v1" },
                status: { type: "string", example: "ok" },
                docs: { type: "string", example: "/api/docs" },
                openapi: { type: "string", example: "/api/openapi" }
              },
              required: ["name", "version", "status", "docs", "openapi"],
              additionalProperties: false
            }
          }
        }
      },
      "500": { description: "Unexpected server error.", content: { "application/json": { schema: errorResponse("Internal server error.", "INTERNAL_ERROR") } } }
    }
  },
  "GET /api/v1/health": {
    summary: "Health check",
    description: "Checks if the Auth API is up and responding.",
    security: [],
    responses: {
      "200": {
        description: "Auth API health status.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string", example: "PetLink auth API" },
                status: { type: "string", example: "ok" },
                timestamp: { type: "string", example: "2026-06-06T06:56:59.000Z" }
              },
              required: ["name", "status", "timestamp"],
              additionalProperties: false
            }
          }
        }
      },
      "500": { description: "Unexpected server error.", content: { "application/json": { schema: errorResponse("Internal server error.", "INTERNAL_ERROR") } } }
    }
  },

  // ── Auth ───────────────────────────────────────────────────────────────────
  "POST /api/v1/auth/signup": {
    summary: "Register user and create initial session",
    description: "Creates a Supabase auth user, provisions the PetLink profile and returns session tokens.",
    tags: ["Auth"],
    security: [],
    requestBody: {
      required: true,
      description: "Signup payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              email: { type: "string", format: "email", example: "user@example.com" },
              password: { type: "string", minLength: 6, example: "secretpass" },
              fullName: { type: "string", minLength: 2, maxLength: 120, example: "María Pérez" },
              role: { type: "string", enum: ["OWNER", "PROVIDER"], example: "OWNER" }
            },
            required: ["email", "password", "fullName", "role"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "201": {
        description: "User registered. Returns session tokens and profile.",
        content: {
          "application/json": {
            schema: successResponse("Usuario registrado exitosamente.", {
              type: "object",
              properties: {
                access_token: { type: "string" },
                refresh_token: { type: "string" },
                user: { type: "object", additionalProperties: true, description: "Supabase auth user object." },
                profile: userProfileSchema
              },
              required: ["access_token", "refresh_token", "user", "profile"],
              additionalProperties: false
            })
          }
        }
      },
      "400": standardErrors["400"],
      "409": { description: "Email already registered.", content: { "application/json": { schema: errorResponse("Este correo ya está registrado.", "CONFLICT") } } },
      "422": standardErrors["422"],
      "500": standardErrors["500"]
    }
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  "POST /api/v1/users": {
    summary: "Create or provision user profile",
    description: "Creates the authenticated user's PetLink profile (fullName, phone, city, location). Idempotent.",
    tags: ["Users"],
    requestBody: {
      required: true,
      description: "Profile creation payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              fullName: { type: "string", minLength: 2, maxLength: 120, example: "María Pérez" },
              phone: { type: ["string", "null"], maxLength: 30, example: "+56912345678" },
              city: { type: ["string", "null"], maxLength: 80, example: "Santiago" },
              location: { type: ["string", "null"], maxLength: 255, example: "Providencia, Santiago" }
            },
            required: ["fullName"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "201": { description: "Profile created.", content: { "application/json": { schema: successResponse("User profile created.", userProfileSchema) } } },
      "400": standardErrors["400"],
      "401": standardErrors["401"],
      "422": standardErrors["422"],
      "500": standardErrors["500"]
    }
  },
  "GET /api/v1/users/me": {
    summary: "Get my profile",
    description: "Returns the PetLink profile of the authenticated user.",
    tags: ["Users"],
    responses: {
      "200": { description: "Authenticated user profile.", content: { "application/json": { schema: successResponse("User profile fetched.", userProfileSchema) } } },
      "401": standardErrors["401"],
      "404": standardErrors["404"],
      "500": standardErrors["500"]
    }
  },
  "PATCH /api/v1/users/me": {
    summary: "Update my profile",
    description: "Updates mutable fields (fullName, phone, city, location) of the authenticated user profile.",
    tags: ["Users"],
    requestBody: {
      required: true,
      description: "Fields to update (all optional).",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              fullName: { type: "string", minLength: 2, maxLength: 120, example: "María Pérez" },
              phone: { type: ["string", "null"], maxLength: 30, example: "+56912345678" },
              city: { type: ["string", "null"], maxLength: 80, example: "Santiago" },
              location: { type: ["string", "null"], maxLength: 255, example: "Providencia, Santiago" }
            },
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "200": { description: "Profile updated.", content: { "application/json": { schema: successResponse("User profile updated.", userProfileSchema) } } },
      "400": standardErrors["400"],
      "401": standardErrors["401"],
      "404": standardErrors["404"],
      "422": standardErrors["422"],
      "500": standardErrors["500"]
    }
  },
  "GET /api/v1/users/{id}": {
    summary: "Get profile by auth user ID",
    description: "Fetches a public user profile by auth user ID. Returns only public fields (no userId).",
    tags: ["Users"],
    parameters: [{ name: "id", in: "path", required: true, description: "Auth user UUID.", schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": {
        description: "Public user profile.",
        content: {
          "application/json": {
            schema: successResponse("User profile fetched.", {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                fullName: { type: "string", example: "María Pérez" },
                avatarUrl: { type: "string", nullable: true },
                role: { type: "string", enum: ["OWNER", "PROVIDER", "ADMIN"] },
                city: { type: "string", nullable: true, example: "Santiago" },
                location: { type: "string", nullable: true },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" }
              },
              required: ["id", "fullName", "avatarUrl", "role", "city", "location", "createdAt", "updatedAt"],
              additionalProperties: false
            })
          }
        }
      },
      "401": standardErrors["401"],
      "404": standardErrors["404"],
      "500": standardErrors["500"]
    }
  }
};

export function getAuthOpenApiSpec() {
  return buildOpenApiSpec({
    title: "PetLink Auth API",
    description: "OpenAPI documentation for authentication and user profile endpoints.",
    apiDir: path.join(process.cwd(), "src", "app", "api", "v1"),
    publicOperations: ["GET /api/v1", "GET /api/v1/health", "POST /api/v1/auth/signup", "GET /api/v1/users/{id}"],
    overrides: authOverrides
  });
}
