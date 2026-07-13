import {
  bearerAuth,
  buildOpenApiDocument,
  errors,
  jsonBody,
  okListResponse,
  okResponse,
  ref,
  type Json
} from "@petlink/shared";

const PROD_SERVER = "https://petlink-pets.vercel.app/api/v1";
const LOCAL_SERVER = "http://localhost:3002/api/v1";

const PET_SEX = ["MALE", "FEMALE"];
const ANNOUNCEMENT_TYPE = ["LOST_PET", "FOUND_PET", "ADOPTION", "ADVERTISING", "GENERAL"];
const HEALTH_RECORD_TYPE = ["VACCINATION", "VET_VISIT", "TREATMENT", "MEDICATION", "ALLERGY", "SURGERY", "OTHER"];

/** Reusable page/pageSize query params for paginated list endpoints. */
const paginationParams: Json[] = [
  { name: "page", in: "query", required: false, schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "pageSize", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } }
];

const schemas: Json = {
  Pet: {
    type: "object",
    required: ["id", "ownerId", "name", "species", "breed", "age", "weight", "sex", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      ownerId: { type: "string", format: "uuid" },
      name: { type: "string", example: "Firulais" },
      species: { type: "string", example: "Perro" },
      breed: { type: "string", example: "Labrador" },
      age: { type: "integer", example: 3 },
      weight: { type: "number", example: 28.5 },
      sex: { type: "string", enum: PET_SEX },
      description: { type: "string", nullable: true },
      isSterilized: { type: "boolean" },
      isVaccinated: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  },
  CreatePetRequest: {
    type: "object",
    required: ["name", "species", "breed", "age", "weight", "sex"],
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100 },
      species: { type: "string", minLength: 1, maxLength: 80 },
      breed: { type: "string", minLength: 1, maxLength: 120 },
      age: { type: "integer", minimum: 0, maximum: 100 },
      weight: { type: "number", exclusiveMinimum: 0, maximum: 500, example: 28.5 },
      sex: { type: "string", enum: PET_SEX },
      description: { type: "string", nullable: true },
      isSterilized: { type: "boolean", default: false },
      isVaccinated: { type: "boolean", default: false }
    }
  },
  UpdatePetRequest: {
    type: "object",
    properties: {
      name: { type: "string", minLength: 1, maxLength: 100 },
      species: { type: "string", minLength: 1, maxLength: 80 },
      breed: { type: "string", minLength: 1, maxLength: 120 },
      age: { type: "integer", minimum: 0, maximum: 100 },
      weight: { type: "number", exclusiveMinimum: 0, maximum: 500 },
      sex: { type: "string", enum: PET_SEX },
      description: { type: "string", nullable: true },
      isSterilized: { type: "boolean" },
      isVaccinated: { type: "boolean" }
    }
  },
  Announcement: {
    type: "object",
    required: ["id", "authorId", "type", "title", "description", "isActive", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      authorId: { type: "string", format: "uuid" },
      type: { type: "string", enum: ANNOUNCEMENT_TYPE },
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
    }
  },
  CreateAnnouncementRequest: {
    type: "object",
    required: ["type", "title", "description"],
    properties: {
      type: { type: "string", enum: ANNOUNCEMENT_TYPE },
      title: { type: "string", minLength: 3, maxLength: 200 },
      description: { type: "string", minLength: 10, maxLength: 3000 },
      imageUrl: { type: "string", format: "uri", nullable: true },
      contactPhone: { type: "string", nullable: true },
      contactEmail: { type: "string", format: "email", nullable: true },
      location: { type: "string", nullable: true },
      city: { type: "string", nullable: true },
      lat: { type: "number", minimum: -90, maximum: 90, nullable: true },
      lng: { type: "number", minimum: -180, maximum: 180, nullable: true },
      petId: { type: "string", format: "uuid", nullable: true },
      expiresAt: { type: "string", format: "date-time", nullable: true }
    }
  },
  UpdateAnnouncementRequest: {
    type: "object",
    description: "Todos los campos son opcionales; incluye además `isActive`.",
    properties: {
      type: { type: "string", enum: ANNOUNCEMENT_TYPE },
      title: { type: "string", minLength: 3, maxLength: 200 },
      description: { type: "string", minLength: 10, maxLength: 3000 },
      imageUrl: { type: "string", format: "uri", nullable: true },
      contactPhone: { type: "string", nullable: true },
      contactEmail: { type: "string", format: "email", nullable: true },
      location: { type: "string", nullable: true },
      city: { type: "string", nullable: true },
      lat: { type: "number", nullable: true },
      lng: { type: "number", nullable: true },
      petId: { type: "string", format: "uuid", nullable: true },
      isActive: { type: "boolean" },
      expiresAt: { type: "string", format: "date-time", nullable: true }
    }
  },
  HealthRecord: {
    type: "object",
    required: ["id", "petId", "type", "recordDate", "description", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      petId: { type: "string", format: "uuid" },
      type: { type: "string", enum: HEALTH_RECORD_TYPE },
      recordDate: { type: "string", format: "date-time" },
      description: { type: "string" },
      notes: { type: "string", nullable: true },
      nextDueDate: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  },
  CreateHealthRecordRequest: {
    type: "object",
    required: ["petId", "type", "recordDate", "description"],
    properties: {
      petId: { type: "string", format: "uuid" },
      type: { type: "string", enum: HEALTH_RECORD_TYPE },
      recordDate: { type: "string", format: "date-time" },
      description: { type: "string", minLength: 5, maxLength: 2000 },
      notes: { type: "string", nullable: true },
      nextDueDate: { type: "string", format: "date-time", nullable: true }
    }
  },
  UpdateHealthRecordRequest: {
    type: "object",
    properties: {
      type: { type: "string", enum: HEALTH_RECORD_TYPE },
      recordDate: { type: "string", format: "date-time" },
      description: { type: "string", minLength: 5, maxLength: 2000 },
      notes: { type: "string", nullable: true },
      nextDueDate: { type: "string", format: "date-time", nullable: true }
    }
  },
  MatchPreference: {
    type: "object",
    required: ["id", "petId", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      petId: { type: "string", format: "uuid" },
      preferredBreed: { type: "string", nullable: true },
      preferredSex: { type: "string", enum: PET_SEX, nullable: true },
      minAge: { type: "integer", nullable: true },
      maxAge: { type: "integer", nullable: true },
      preferredLocation: { type: "string", nullable: true },
      healthRequirements: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  },
  UpsertMatchPreferenceRequest: {
    type: "object",
    required: ["petId"],
    properties: {
      petId: { type: "string", format: "uuid" },
      preferredBreed: { type: "string", nullable: true },
      preferredSex: { type: "string", enum: PET_SEX, nullable: true },
      minAge: { type: "integer", minimum: 0, maximum: 100, nullable: true },
      maxAge: { type: "integer", minimum: 0, maximum: 100, nullable: true },
      preferredLocation: { type: "string", nullable: true },
      healthRequirements: { type: "string", nullable: true }
    }
  },
  MediaUpload: {
    type: "object",
    required: ["bucket", "path", "url", "contentType", "size", "fileName"],
    properties: {
      bucket: { type: "string" },
      path: { type: "string" },
      url: { type: "string", format: "uri" },
      contentType: { type: "string", enum: ["image/jpeg", "image/png", "image/webp"] },
      size: { type: "integer" },
      fileName: { type: "string" }
    }
  },
  HealthStatus: {
    type: "object",
    properties: {
      status: { type: "string", example: "ok" },
      app: { type: "string", example: "pets" },
      db: { type: "string", example: "connected" }
    }
  }
};

const imageUploadBody: Json = {
  required: true,
  content: {
    "multipart/form-data": {
      schema: {
        type: "object",
        required: ["file"],
        properties: {
          file: { type: "string", format: "binary", description: "Imagen JPEG/PNG/WebP, máx 5 MB." }
        }
      }
    }
  }
};

const paths: Json = {
  "/pets": {
    get: {
      tags: ["Pets"],
      summary: "Listar las mascotas del usuario autenticado (paginado)",
      security: bearerAuth,
      parameters: paginationParams,
      responses: {
        "200": okListResponse("Página de mascotas.", ref("Pet"), true),
        "401": errors.unauthorized
      }
    },
    post: {
      tags: ["Pets"],
      summary: "Crear una mascota",
      security: bearerAuth,
      requestBody: jsonBody(ref("CreatePetRequest")),
      responses: {
        "201": okResponse("Mascota creada.", ref("Pet")),
        "401": errors.unauthorized,
        "422": errors.validation
      }
    }
  },
  "/pets/{id}": {
    get: {
      tags: ["Pets"],
      summary: "Obtener una mascota por id",
      security: bearerAuth,
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": okResponse("Mascota.", ref("Pet")),
        "401": errors.unauthorized,
        "404": errors.notFound
      }
    },
    patch: {
      tags: ["Pets"],
      summary: "Actualizar una mascota",
      security: bearerAuth,
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: jsonBody(ref("UpdatePetRequest")),
      responses: {
        "200": okResponse("Mascota actualizada.", ref("Pet")),
        "401": errors.unauthorized,
        "404": errors.notFound,
        "422": errors.validation
      }
    },
    delete: {
      tags: ["Pets"],
      summary: "Eliminar una mascota",
      security: bearerAuth,
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": okResponse("Mascota eliminada.", { type: "object" }),
        "401": errors.unauthorized,
        "404": errors.notFound
      }
    }
  },
  "/announcements": {
    get: {
      tags: ["Announcements"],
      summary: "Listar anuncios (público, paginado)",
      security: [],
      parameters: [
        ...paginationParams,
        { name: "type", in: "query", required: false, schema: { type: "string", enum: ANNOUNCEMENT_TYPE } },
        { name: "city", in: "query", required: false, schema: { type: "string" } },
        { name: "authorId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
        { name: "isActive", in: "query", required: false, schema: { type: "boolean" } }
      ],
      responses: { "200": okListResponse("Página de anuncios.", ref("Announcement"), true) }
    },
    post: {
      tags: ["Announcements"],
      summary: "Crear un anuncio",
      security: bearerAuth,
      requestBody: jsonBody(ref("CreateAnnouncementRequest")),
      responses: {
        "201": okResponse("Anuncio creado.", ref("Announcement")),
        "401": errors.unauthorized,
        "422": errors.validation
      }
    }
  },
  "/announcements/{id}": {
    get: {
      tags: ["Announcements"],
      summary: "Obtener un anuncio por id (público)",
      security: [],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: { "200": okResponse("Anuncio.", ref("Announcement")), "404": errors.notFound }
    },
    patch: {
      tags: ["Announcements"],
      summary: "Actualizar un anuncio (autor)",
      security: bearerAuth,
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: jsonBody(ref("UpdateAnnouncementRequest")),
      responses: {
        "200": okResponse("Anuncio actualizado.", ref("Announcement")),
        "401": errors.unauthorized,
        "403": errors.forbidden,
        "404": errors.notFound,
        "422": errors.validation
      }
    },
    delete: {
      tags: ["Announcements"],
      summary: "Eliminar un anuncio (autor)",
      security: bearerAuth,
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": okResponse("Anuncio eliminado.", { type: "object" }),
        "401": errors.unauthorized,
        "403": errors.forbidden,
        "404": errors.notFound
      }
    }
  },
  "/health-records": {
    post: {
      tags: ["HealthRecords"],
      summary: "Crear un registro de salud",
      security: bearerAuth,
      requestBody: jsonBody(ref("CreateHealthRecordRequest")),
      responses: {
        "201": okResponse("Registro creado.", ref("HealthRecord")),
        "401": errors.unauthorized,
        "422": errors.validation
      }
    }
  },
  "/health-records/pet/{petId}": {
    get: {
      tags: ["HealthRecords"],
      summary: "Listar los registros de salud de una mascota (paginado)",
      security: bearerAuth,
      parameters: [
        { name: "petId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ...paginationParams
      ],
      responses: {
        "200": okListResponse("Página de registros de salud.", ref("HealthRecord"), true),
        "401": errors.unauthorized,
        "404": errors.notFound
      }
    }
  },
  "/health-records/{id}": {
    patch: {
      tags: ["HealthRecords"],
      summary: "Actualizar un registro de salud",
      security: bearerAuth,
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: jsonBody(ref("UpdateHealthRecordRequest")),
      responses: {
        "200": okResponse("Registro actualizado.", ref("HealthRecord")),
        "401": errors.unauthorized,
        "404": errors.notFound,
        "422": errors.validation
      }
    },
    delete: {
      tags: ["HealthRecords"],
      summary: "Eliminar un registro de salud",
      security: bearerAuth,
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      responses: {
        "200": okResponse("Registro eliminado.", { type: "object" }),
        "401": errors.unauthorized,
        "404": errors.notFound
      }
    }
  },
  "/match": {
    get: {
      tags: ["Match"],
      summary: "Buscar mascotas compatibles según las preferencias",
      security: bearerAuth,
      parameters: [
        { name: "petId", in: "query", required: true, schema: { type: "string", format: "uuid" } },
        { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 50 } }
      ],
      responses: {
        "200": okListResponse("Mascotas compatibles.", ref("Pet")),
        "401": errors.unauthorized,
        "422": errors.validation
      }
    }
  },
  "/match/preferences": {
    post: {
      tags: ["Match"],
      summary: "Crear o actualizar las preferencias de match de una mascota",
      security: bearerAuth,
      requestBody: jsonBody(ref("UpsertMatchPreferenceRequest")),
      responses: {
        "200": okResponse("Preferencias guardadas.", ref("MatchPreference")),
        "401": errors.unauthorized,
        "422": errors.validation
      }
    }
  },
  "/media/pets/{petId}": {
    post: {
      tags: ["Media"],
      summary: "Subir una imagen para una mascota",
      security: bearerAuth,
      parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      requestBody: imageUploadBody,
      responses: {
        "201": okResponse("Imagen subida.", ref("MediaUpload")),
        "400": errors.badRequest,
        "401": errors.unauthorized,
        "422": errors.validation
      }
    }
  },
  "/media/users/me/avatar": {
    post: {
      tags: ["Media"],
      summary: "Subir el avatar del usuario autenticado",
      security: bearerAuth,
      requestBody: imageUploadBody,
      responses: {
        "201": okResponse("Avatar subido.", ref("MediaUpload")),
        "400": errors.badRequest,
        "401": errors.unauthorized,
        "422": errors.validation
      }
    }
  },
  "/health": {
    get: {
      tags: ["System"],
      summary: "Healthcheck (incluye verificación de base de datos)",
      security: [],
      responses: {
        "200": { description: "Servicio operativo.", content: { "application/json": { schema: ref("HealthStatus") } } },
        "503": { description: "Base de datos no disponible.", content: { "application/json": { schema: ref("HealthStatus") } } }
      }
    }
  }
};

export const petsOpenApiDocument = buildOpenApiDocument({
  title: "PetLink · Pets API",
  description:
    "API de mascotas de PetLink: mascotas, anuncios (perdidos/adopción), fichas de salud, match y subida de imágenes. Los listados de anuncios son públicos; el resto requiere token Bearer de Supabase.",
  servers: [
    { url: PROD_SERVER, description: "Producción (Vercel)" },
    { url: LOCAL_SERVER, description: "Local" }
  ],
  tags: [
    { name: "Pets", description: "Mascotas del usuario." },
    { name: "Announcements", description: "Anuncios (perdidos, encontrados, adopción, etc.)." },
    { name: "HealthRecords", description: "Fichas de salud." },
    { name: "Match", description: "Preferencias y búsqueda de mascotas compatibles." },
    { name: "Media", description: "Subida de imágenes (mascotas y avatar)." },
    { name: "System", description: "Salud del servicio." }
  ],
  paths,
  schemas
});
