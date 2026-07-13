/**
 * Tiny, dependency-free helpers to assemble OpenAPI 3.0 documents that mirror
 * PetLink's response envelope ({ success, message, data }) and shared error
 * shape. Each API app supplies its own paths + entity schemas; this module
 * injects the common security scheme, error responses and pagination meta.
 */

export type Json = Record<string, unknown>;

/** Applies the bearer requirement to an operation. */
export const bearerAuth = [{ bearerAuth: [] as string[] }];

/** `$ref` to a schema defined under components.schemas. */
export const ref = (schema: string): Json => ({ $ref: `#/components/schemas/${schema}` });

/** Reusable `$ref`s to the shared error responses (see buildBaseComponents). */
export const errors = {
  badRequest: { $ref: "#/components/responses/BadRequest" },
  unauthorized: { $ref: "#/components/responses/Unauthorized" },
  forbidden: { $ref: "#/components/responses/Forbidden" },
  notFound: { $ref: "#/components/responses/NotFound" },
  validation: { $ref: "#/components/responses/ValidationError" },
  tooManyRequests: { $ref: "#/components/responses/TooManyRequests" }
} as const;

/** JSON request body wrapper. */
export const jsonBody = (schema: Json, required = true): Json => ({
  required,
  content: { "application/json": { schema } }
});

/** 2xx response carrying a single object under the success envelope. */
export const okResponse = (description: string, dataSchema: Json): Json => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["success", "message", "data"],
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: dataSchema
        }
      }
    }
  }
});

/** 2xx response carrying an array under the success envelope (optionally paginated). */
export const okListResponse = (description: string, itemSchema: Json, paginated = false): Json => {
  const properties: Json = {
    success: { type: "boolean", example: true },
    message: { type: "string" },
    data: { type: "array", items: itemSchema }
  };
  const required = ["success", "message", "data"];
  if (paginated) {
    properties.meta = ref("PaginationMeta");
    required.push("meta");
  }
  return {
    description,
    content: { "application/json": { schema: { type: "object", required, properties } } }
  };
};

const errorResponse = (description: string): Json => ({
  description,
  content: { "application/json": { schema: ref("ApiError") } }
});

/**
 * Shared components every PetLink API document includes: the bearer security
 * scheme, the ApiError envelope, pagination meta, and the standard error
 * responses referenced by `errors`.
 */
const buildBaseComponents = () => ({
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description:
        "Token de acceso de Supabase. Obtén uno con POST /auth/signup (API auth) o con el login de Supabase en el cliente, y pégalo aquí como Bearer."
    }
  },
  schemas: {
    ApiError: {
      type: "object",
      required: ["success", "message", "errorCode"],
      properties: {
        success: { type: "boolean", example: false },
        message: { type: "string", example: "Recurso no encontrado." },
        errorCode: { type: "string", example: "NOT_FOUND" },
        details: { nullable: true, description: "Detalle opcional (p. ej. issues de validación de Zod)." }
      }
    },
    PaginationMeta: {
      type: "object",
      required: ["page", "pageSize", "total", "totalPages"],
      properties: {
        page: { type: "integer", example: 1 },
        pageSize: { type: "integer", example: 20 },
        total: { type: "integer", example: 137 },
        totalPages: { type: "integer", example: 7 }
      }
    }
  },
  responses: {
    BadRequest: errorResponse("Solicitud inválida."),
    Unauthorized: errorResponse("Falta el token Bearer o es inválido."),
    Forbidden: errorResponse("Autenticado pero sin permiso sobre el recurso."),
    NotFound: errorResponse("Recurso no encontrado."),
    ValidationError: errorResponse("El payload no pasó la validación (Zod)."),
    TooManyRequests: errorResponse("Se superó el límite de peticiones (rate limit).")
  }
});

export type OpenApiInput = {
  title: string;
  version?: string;
  description: string;
  servers: { url: string; description?: string }[];
  tags: { name: string; description?: string }[];
  /** OpenAPI paths object. */
  paths: Json;
  /** App-specific component schemas (merged with the shared ones). */
  schemas: Json;
};

/** Assembles a complete OpenAPI 3.0.3 document from app-specific pieces. */
export const buildOpenApiDocument = (input: OpenApiInput): Json => {
  const base = buildBaseComponents();
  return {
    openapi: "3.0.3",
    info: {
      title: input.title,
      version: input.version ?? "1.0.0",
      description: input.description,
      contact: { name: "PetLink", url: "https://petlink-web-seven.vercel.app" }
    },
    servers: input.servers,
    tags: input.tags,
    components: {
      securitySchemes: base.securitySchemes,
      schemas: { ...base.schemas, ...input.schemas },
      responses: base.responses
    },
    paths: input.paths
  };
};
