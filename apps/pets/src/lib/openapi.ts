import path from "node:path";

import { buildOpenApiSpec, type OpenApiOverrides } from "@petlink/shared/lib/openapi";

// ─── Reusable schemas ────────────────────────────────────────────────────────

const errResp = (message: string, errorCode: string) => ({
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

const okResp = (message: string, dataSchema: Record<string, unknown>) => ({
  type: "object",
  properties: {
    success: { type: "boolean", example: true },
    message: { type: "string", example: message },
    data: dataSchema
  },
  required: ["success", "message", "data"],
  additionalProperties: false
});

const std = {
  "400": { description: "Invalid JSON body.", content: { "application/json": { schema: errResp("Request body must be valid JSON.", "VALIDATION_ERROR") } } },
  "401": { description: "Missing or invalid Authorization header.", content: { "application/json": { schema: errResp("Authorization header is required.", "UNAUTHORIZED") } } },
  "403": { description: "Access denied.", content: { "application/json": { schema: errResp("You do not have access to this resource.", "FORBIDDEN") } } },
  "404": { description: "Resource not found.", content: { "application/json": { schema: errResp("Resource not found.", "RESOURCE_NOT_FOUND") } } },
  "422": { description: "Validation error.", content: { "application/json": { schema: errResp("Invalid payload.", "VALIDATION_ERROR") } } },
  "500": { description: "Internal server error.", content: { "application/json": { schema: errResp("Internal server error.", "INTERNAL_ERROR") } } }
};

const petSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    ownerId: { type: "string", format: "uuid" },
    name: { type: "string", example: "Rex" },
    species: { type: "string", example: "Perro" },
    breed: { type: "string", example: "Labrador" },
    age: { type: "integer", minimum: 0, example: 3 },
    weight: { type: "number", example: 25.5 },
    sex: { type: "string", enum: ["MALE", "FEMALE"] },
    imageUrl: { type: "string", nullable: true },
    images: { type: "array", items: { type: "object", properties: { imageUrl: { type: "string" }, createdAt: { type: "string", format: "date-time" } }, required: ["imageUrl", "createdAt"], additionalProperties: false } },
    description: { type: "string", nullable: true },
    isSterilized: { type: "boolean" },
    isVaccinated: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "ownerId", "name", "species", "breed", "age", "weight", "sex", "imageUrl", "images", "description", "isSterilized", "isVaccinated", "createdAt", "updatedAt"],
  additionalProperties: false
};

const healthRecordSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    petId: { type: "string", format: "uuid" },
    type: { type: "string", enum: ["VACCINATION", "VET_VISIT", "TREATMENT", "MEDICATION", "ALLERGY", "SURGERY", "OTHER"] },
    recordDate: { type: "string", format: "date-time" },
    description: { type: "string" },
    notes: { type: "string", nullable: true },
    nextDueDate: { type: "string", format: "date-time", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "petId", "type", "recordDate", "description", "notes", "nextDueDate", "createdAt", "updatedAt"],
  additionalProperties: false
};

const matchPreferenceSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    petId: { type: "string", format: "uuid" },
    preferredBreed: { type: "string", nullable: true },
    preferredSex: { type: "string", enum: ["MALE", "FEMALE"], nullable: true },
    minAge: { type: "integer", nullable: true },
    maxAge: { type: "integer", nullable: true },
    preferredLocation: { type: "string", nullable: true },
    healthRequirements: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "petId", "preferredBreed", "preferredSex", "minAge", "maxAge", "preferredLocation", "healthRequirements", "createdAt", "updatedAt"],
  additionalProperties: false
};

const compatiblePetSchema = {
  type: "object",
  properties: {
    compatibilityScore: { type: "number", example: 0.85 },
    reasons: { type: "array", items: { type: "string" } },
    pet: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        species: { type: "string" },
        breed: { type: "string" },
        age: { type: "integer" },
        weight: { type: "number" },
        sex: { type: "string", enum: ["MALE", "FEMALE"] },
        description: { type: "string", nullable: true },
        isSterilized: { type: "boolean" },
        isVaccinated: { type: "boolean" },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" }
      },
      required: ["id", "name", "species", "breed", "age", "weight", "sex", "description", "isSterilized", "isVaccinated", "createdAt", "updatedAt"],
      additionalProperties: false
    }
  },
  required: ["compatibilityScore", "reasons", "pet"],
  additionalProperties: false
};

const announcementSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    authorId: { type: "string", format: "uuid" },
    type: { type: "string", enum: ["LOST_PET", "FOUND_PET", "ADOPTION", "ADVERTISING", "GENERAL"] },
    title: { type: "string" },
    description: { type: "string" },
    imageUrl: { type: "string", nullable: true },
    contactPhone: { type: "string", nullable: true },
    contactEmail: { type: "string", nullable: true },
    location: { type: "string", nullable: true },
    city: { type: "string", nullable: true },
    lat: { type: "number", nullable: true },
    lng: { type: "number", nullable: true },
    petId: { type: "string", format: "uuid", nullable: true },
    isActive: { type: "boolean" },
    expiresAt: { type: "string", format: "date-time", nullable: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "authorId", "type", "title", "description", "imageUrl", "contactPhone", "contactEmail", "location", "city", "lat", "lng", "petId", "isActive", "expiresAt", "createdAt", "updatedAt"],
  additionalProperties: false
};

const mediaUploadSchema = {
  type: "object",
  properties: {
    bucket: { type: "string", example: "pet-images" },
    path: { type: "string", example: "pets/abc123/photo.jpg" },
    url: { type: "string", format: "uri" },
    contentType: { type: "string", example: "image/jpeg" },
    size: { type: "integer", example: 204800 },
    fileName: { type: "string", example: "photo.jpg" }
  },
  required: ["bucket", "path", "url", "contentType", "size", "fileName"],
  additionalProperties: false
};

// ─── Overrides ───────────────────────────────────────────────────────────────

const petsOverrides: OpenApiOverrides = {
  // ── Status & health ────────────────────────────────────────────────────────
  "GET /api/v1": {
    summary: "Pets service status",
    description: "Returns a basic status payload for the Pets API.",
    security: [],
    responses: {
      "200": {
        description: "Pets API status.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string", example: "PetLink pets API" },
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
      "500": { description: "Unexpected server error.", content: { "application/json": { schema: errResp("Internal server error.", "INTERNAL_ERROR") } } }
    }
  },
  "GET /api/v1/health": {
    summary: "Health check",
    description: "Checks if the Pets API is up and responding.",
    security: [],
    responses: {
      "200": {
        description: "Pets API health status.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string", example: "PetLink pets API" },
                status: { type: "string", example: "ok" },
                timestamp: { type: "string", example: "2026-06-06T06:56:59.000Z" }
              },
              required: ["name", "status", "timestamp"],
              additionalProperties: false
            }
          }
        }
      },
      "500": { description: "Unexpected server error.", content: { "application/json": { schema: errResp("Internal server error.", "INTERNAL_ERROR") } } }
    }
  },

  // ── Pets ───────────────────────────────────────────────────────────────────
  "POST /api/v1/pets": {
    summary: "Create pet",
    description: "Registers a new pet for the authenticated owner.",
    tags: ["Pets"],
    requestBody: {
      required: true,
      description: "Pet creation payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string", minLength: 1, maxLength: 100, example: "Rex" },
              species: { type: "string", minLength: 1, maxLength: 80, example: "Perro" },
              breed: { type: "string", minLength: 1, maxLength: 120, example: "Labrador" },
              age: { type: "integer", minimum: 0, maximum: 100, example: 3 },
              weight: { type: "number", exclusiveMinimum: 0, maximum: 500, example: 25.5 },
              sex: { type: "string", enum: ["MALE", "FEMALE"] },
              description: { type: ["string", "null"] },
              isSterilized: { type: "boolean", default: false },
              isVaccinated: { type: "boolean", default: false }
            },
            required: ["name", "species", "breed", "age", "weight", "sex"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "201": { description: "Pet created.", content: { "application/json": { schema: okResp("Pet created successfully.", petSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "GET /api/v1/pets": {
    summary: "List my pets",
    description: "Returns all pets that belong to the authenticated user.",
    tags: ["Pets"],
    responses: {
      "200": { description: "Pets list.", content: { "application/json": { schema: okResp("Pets fetched successfully.", { type: "array", items: petSchema }) } } },
      "401": std["401"],
      "500": std["500"]
    }
  },
  "GET /api/v1/pets/{id}": {
    summary: "Get pet by id",
    description: "Returns a single pet if the authenticated user owns it.",
    tags: ["Pets"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Pet details.", content: { "application/json": { schema: okResp("Pet fetched successfully.", petSchema) } } },
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "500": std["500"]
    }
  },
  "PATCH /api/v1/pets/{id}": {
    summary: "Update pet",
    description: "Updates mutable fields of a pet owned by the authenticated user.",
    tags: ["Pets"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      required: true,
      description: "Fields to update (all optional).",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string", minLength: 1, maxLength: 100 },
              species: { type: "string", minLength: 1, maxLength: 80 },
              breed: { type: "string", minLength: 1, maxLength: 120 },
              age: { type: "integer", minimum: 0, maximum: 100 },
              weight: { type: "number", exclusiveMinimum: 0, maximum: 500 },
              sex: { type: "string", enum: ["MALE", "FEMALE"] },
              description: { type: ["string", "null"] },
              isSterilized: { type: "boolean" },
              isVaccinated: { type: "boolean" }
            },
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "200": { description: "Pet updated.", content: { "application/json": { schema: okResp("Pet updated successfully.", petSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "DELETE /api/v1/pets/{id}": {
    summary: "Delete pet",
    description: "Deletes a pet owned by the authenticated user.",
    tags: ["Pets"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Pet deleted.", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string", example: "Pet deleted successfully." } }, required: ["success", "message"], additionalProperties: false } } } },
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "500": std["500"]
    }
  },

  // ── Health Records ─────────────────────────────────────────────────────────
  "POST /api/v1/health-records": {
    summary: "Create health record",
    description: "Creates a health record associated with a pet owned by the authenticated user.",
    tags: ["Health Records"],
    requestBody: {
      required: true,
      description: "Health record creation payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              petId: { type: "string", format: "uuid" },
              type: { type: "string", enum: ["VACCINATION", "VET_VISIT", "TREATMENT", "MEDICATION", "ALLERGY", "SURGERY", "OTHER"] },
              recordDate: { type: "string", format: "date-time", example: "2026-01-15T10:00:00.000Z" },
              description: { type: "string", minLength: 5, maxLength: 2000 },
              notes: { type: ["string", "null"] },
              nextDueDate: { type: ["string", "null"], format: "date-time" }
            },
            required: ["petId", "type", "recordDate", "description"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "201": { description: "Health record created.", content: { "application/json": { schema: okResp("Health record created successfully.", healthRecordSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "403": std["403"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "GET /api/v1/health-records/pet/{petId}": {
    summary: "List pet health records",
    description: "Returns all health records for a pet owned by the authenticated user.",
    tags: ["Health Records"],
    parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Health records list.", content: { "application/json": { schema: okResp("Health records fetched successfully.", { type: "array", items: healthRecordSchema }) } } },
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "500": std["500"]
    }
  },
  "PATCH /api/v1/health-records/{id}": {
    summary: "Update health record",
    description: "Updates an existing health record owned by the authenticated user.",
    tags: ["Health Records"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      required: true,
      description: "Fields to update (all optional).",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["VACCINATION", "VET_VISIT", "TREATMENT", "MEDICATION", "ALLERGY", "SURGERY", "OTHER"] },
              recordDate: { type: "string", format: "date-time" },
              description: { type: "string", minLength: 5, maxLength: 2000 },
              notes: { type: ["string", "null"] },
              nextDueDate: { type: ["string", "null"], format: "date-time" }
            },
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "200": { description: "Health record updated.", content: { "application/json": { schema: okResp("Health record updated successfully.", healthRecordSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "DELETE /api/v1/health-records/{id}": {
    summary: "Delete health record",
    description: "Deletes a health record owned by the authenticated user.",
    tags: ["Health Records"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Health record deleted.", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string", example: "Health record deleted successfully." } }, required: ["success", "message"], additionalProperties: false } } } },
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "500": std["500"]
    }
  },

  // ── Match ──────────────────────────────────────────────────────────────────
  "GET /api/v1/match": {
    summary: "Find compatible pets",
    description: "Returns compatible pets for responsible breeding guidance based on the authenticated user's pet.",
    tags: ["Match"],
    parameters: [
      { name: "petId", in: "query", required: true, description: "UUID of the pet to find matches for.", schema: { type: "string", format: "uuid" } },
      { name: "limit", in: "query", required: false, description: "Maximum number of results (1–50).", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } }
    ],
    responses: {
      "200": { description: "Compatible pets list.", content: { "application/json": { schema: okResp("Compatible pets fetched successfully for responsible breeding guidance.", { type: "array", items: compatiblePetSchema }) } } },
      "400": std["400"],
      "401": std["401"],
      "500": std["500"]
    }
  },
  "POST /api/v1/match/preferences": {
    summary: "Save match preferences",
    description: "Creates or updates match preferences for a pet owned by the authenticated user.",
    tags: ["Match"],
    requestBody: {
      required: true,
      description: "Match preference payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              petId: { type: "string", format: "uuid" },
              preferredBreed: { type: ["string", "null"], maxLength: 120 },
              preferredSex: { type: ["string", "null"], enum: ["MALE", "FEMALE", null] },
              minAge: { type: ["integer", "null"], minimum: 0, maximum: 100 },
              maxAge: { type: ["integer", "null"], minimum: 0, maximum: 100 },
              preferredLocation: { type: ["string", "null"], maxLength: 120 },
              healthRequirements: { type: ["string", "null"], maxLength: 300 }
            },
            required: ["petId"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "200": { description: "Match preferences saved.", content: { "application/json": { schema: okResp("Match preference saved successfully.", matchPreferenceSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "403": std["403"],
      "422": std["422"],
      "500": std["500"]
    }
  },

  // ── Announcements ──────────────────────────────────────────────────────────
  "POST /api/v1/announcements": {
    summary: "Create announcement",
    description: "Creates a lost pet, found pet or related community announcement.",
    tags: ["Announcements"],
    requestBody: {
      required: true,
      description: "Announcement creation payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["LOST_PET", "FOUND_PET", "ADOPTION", "ADVERTISING", "GENERAL"] },
              title: { type: "string", minLength: 3, maxLength: 200 },
              description: { type: "string", minLength: 10, maxLength: 3000 },
              imageUrl: { type: ["string", "null"], format: "uri" },
              contactPhone: { type: ["string", "null"], maxLength: 30 },
              contactEmail: { type: ["string", "null"], format: "email" },
              location: { type: ["string", "null"], maxLength: 200 },
              city: { type: ["string", "null"], maxLength: 100 },
              lat: { type: ["number", "null"], minimum: -90, maximum: 90 },
              lng: { type: ["number", "null"], minimum: -180, maximum: 180 },
              petId: { type: ["string", "null"], format: "uuid" },
              expiresAt: { type: ["string", "null"], format: "date-time" }
            },
            required: ["type", "title", "description"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "201": { description: "Announcement created.", content: { "application/json": { schema: okResp("Announcement created successfully.", announcementSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "GET /api/v1/announcements": {
    summary: "List announcements",
    description: "Returns announcements, optionally filtered by type, city, authorId or isActive.",
    tags: ["Announcements"],
    parameters: [
      { name: "type", in: "query", required: false, schema: { type: "string", enum: ["LOST_PET", "FOUND_PET", "ADOPTION", "ADVERTISING", "GENERAL"] } },
      { name: "city", in: "query", required: false, schema: { type: "string" } },
      { name: "authorId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
      { name: "isActive", in: "query", required: false, schema: { type: "string", enum: ["true", "false"] } }
    ],
    responses: {
      "200": { description: "Announcements list.", content: { "application/json": { schema: okResp("Announcements fetched successfully.", { type: "array", items: announcementSchema }) } } },
      "400": std["400"],
      "401": std["401"],
      "500": std["500"]
    }
  },
  "GET /api/v1/announcements/{id}": {
    summary: "Get announcement by id",
    description: "Returns a single announcement by its UUID.",
    tags: ["Announcements"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Announcement details.", content: { "application/json": { schema: okResp("Announcement fetched successfully.", announcementSchema) } } },
      "401": std["401"],
      "404": std["404"],
      "500": std["500"]
    }
  },
  "PATCH /api/v1/announcements/{id}": {
    summary: "Update announcement",
    description: "Updates an announcement owned by the authenticated user.",
    tags: ["Announcements"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      required: true,
      description: "Fields to update (all optional).",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["LOST_PET", "FOUND_PET", "ADOPTION", "ADVERTISING", "GENERAL"] },
              title: { type: "string", minLength: 3, maxLength: 200 },
              description: { type: "string", minLength: 10, maxLength: 3000 },
              imageUrl: { type: ["string", "null"], format: "uri" },
              contactPhone: { type: ["string", "null"], maxLength: 30 },
              contactEmail: { type: ["string", "null"], format: "email" },
              location: { type: ["string", "null"], maxLength: 200 },
              city: { type: ["string", "null"], maxLength: 100 },
              lat: { type: ["number", "null"], minimum: -90, maximum: 90 },
              lng: { type: ["number", "null"], minimum: -180, maximum: 180 },
              petId: { type: ["string", "null"], format: "uuid" },
              isActive: { type: "boolean" },
              expiresAt: { type: ["string", "null"], format: "date-time" }
            },
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "200": { description: "Announcement updated.", content: { "application/json": { schema: okResp("Announcement updated successfully.", announcementSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "DELETE /api/v1/announcements/{id}": {
    summary: "Delete announcement",
    description: "Deletes an announcement owned by the authenticated user.",
    tags: ["Announcements"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Announcement deleted.", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string", example: "Announcement deleted successfully." } }, required: ["success", "message"], additionalProperties: false } } } },
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "500": std["500"]
    }
  },

  // ── Media ──────────────────────────────────────────────────────────────────
  "POST /api/v1/media/pets/{petId}": {
    summary: "Upload pet image",
    description: "Uploads an image for a given pet. Send as `multipart/form-data` with a `file` field.",
    tags: ["Media"],
    parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      required: true,
      description: "Image file (JPEG, PNG, WebP).",
      content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } }, required: ["file"] } } }
    },
    responses: {
      "201": { description: "Image uploaded.", content: { "application/json": { schema: okResp("Pet image uploaded successfully.", mediaUploadSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "403": std["403"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "POST /api/v1/media/users/me/avatar": {
    summary: "Upload user avatar",
    description: "Uploads the profile avatar for the authenticated user. Send as `multipart/form-data` with a `file` field.",
    tags: ["Media"],
    requestBody: {
      required: true,
      description: "Avatar file (JPEG, PNG, WebP).",
      content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } }, required: ["file"] } } }
    },
    responses: {
      "201": { description: "Avatar uploaded.", content: { "application/json": { schema: okResp("Avatar uploaded successfully.", mediaUploadSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "422": std["422"],
      "500": std["500"]
    }
  }
};

export function getPetsOpenApiSpec() {
  return buildOpenApiSpec({
    title: "PetLink Pets API",
    description: "OpenAPI documentation for pet profiles, media, matching, announcements and health records.",
    apiDir: path.join(process.cwd(), "src", "app", "api", "v1"),
    publicOperations: ["GET /api/v1", "GET /api/v1/health"],
    overrides: petsOverrides
  });
}

