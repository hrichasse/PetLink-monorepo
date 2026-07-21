import {
  bearerAuth,
  buildOpenApiDocument,
  errors,
  jsonBody,
  okResponse,
  ref,
  type Json
} from "@petlink/shared";

const PROD_SERVER = "https://petlink-auth.vercel.app/api/v1";
const LOCAL_SERVER = "http://localhost:3001/api/v1";

const USER_ROLES = ["OWNER", "PROVIDER", "ADMIN"];

const schemas: Json = {
  UserProfile: {
    type: "object",
    required: ["id", "userId", "fullName", "role", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid", description: "Id del usuario en Supabase Auth." },
      fullName: { type: "string", example: "Hernán Richasse" },
      phone: { type: "string", nullable: true, example: "+56 9 1234 5678" },
      avatarUrl: { type: "string", nullable: true },
      role: { type: "string", enum: USER_ROLES },
      city: { type: "string", nullable: true, example: "Santiago" },
      location: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  },
  PublicUserProfile: {
    type: "object",
    required: ["id", "fullName", "role", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      fullName: { type: "string" },
      avatarUrl: { type: "string", nullable: true },
      role: { type: "string", enum: USER_ROLES },
      city: { type: "string", nullable: true },
      location: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  },
  SignupRequest: {
    type: "object",
    required: ["email", "password", "fullName", "role"],
    properties: {
      email: { type: "string", format: "email", example: "nuevo@correo.com" },
      password: { type: "string", format: "password", minLength: 6, example: "Test123456" },
      fullName: { type: "string", minLength: 2, maxLength: 120, example: "María Pérez" },
      role: { type: "string", enum: ["OWNER", "PROVIDER"], example: "OWNER" }
    }
  },
  SignupResponse: {
    type: "object",
    required: ["access_token", "refresh_token", "user", "profile"],
    properties: {
      access_token: { type: "string", description: "JWT de Supabase para usar como Bearer." },
      refresh_token: { type: "string" },
      user: { type: "object", description: "Usuario de Supabase Auth." },
      profile: ref("UserProfile")
    }
  },
  CreateUserProfileRequest: {
    type: "object",
    required: ["fullName"],
    properties: {
      fullName: { type: "string", minLength: 2, maxLength: 120 },
      phone: { type: "string", nullable: true, maxLength: 30 },
      city: { type: "string", nullable: true, maxLength: 80 },
      location: { type: "string", nullable: true, maxLength: 255 }
    }
  },
  UpdateUserProfileRequest: {
    type: "object",
    properties: {
      fullName: { type: "string", minLength: 2, maxLength: 120 },
      phone: { type: "string", nullable: true, maxLength: 30 },
      city: { type: "string", nullable: true, maxLength: 80 },
      location: { type: "string", nullable: true, maxLength: 255 }
    }
  },
  HealthStatus: {
    type: "object",
    properties: {
      status: { type: "string", example: "ok" },
      app: { type: "string", example: "auth" },
      db: { type: "string", example: "connected" }
    }
  }
};

const paths: Json = {
  "/auth/signup": {
    post: {
      tags: ["Auth"],
      summary: "Registrar un usuario y obtener sesión",
      description:
        "Endpoint público. Crea el usuario en Supabase (email auto-confirmado), inicia sesión y crea su perfil. Throttled por IP (5/min).",
      security: [],
      requestBody: jsonBody(ref("SignupRequest")),
      responses: {
        "201": okResponse("Usuario registrado.", ref("SignupResponse")),
        "200": okResponse("La sesión se inició (el usuario ya existía).", ref("SignupResponse")),
        "409": { description: "El correo ya está registrado.", content: { "application/json": { schema: ref("ApiError") } } },
        "422": errors.validation,
        "429": errors.tooManyRequests
      }
    }
  },
  "/users": {
    post: {
      tags: ["Users"],
      summary: "Crear (o recuperar) el perfil del usuario autenticado",
      description:
        "Idempotente: 201 si se creó, 200 si ya existía. Pensado para llamarse tras cada login.",
      security: bearerAuth,
      requestBody: jsonBody(ref("CreateUserProfileRequest")),
      responses: {
        "201": okResponse("Perfil creado.", ref("UserProfile")),
        "200": okResponse("El perfil ya existía.", ref("UserProfile")),
        "401": errors.unauthorized,
        "422": errors.validation
      }
    }
  },
  "/users/me": {
    get: {
      tags: ["Users"],
      summary: "Obtener el perfil del usuario autenticado",
      security: bearerAuth,
      responses: {
        "200": okResponse("Perfil del usuario.", ref("UserProfile")),
        "401": errors.unauthorized
      }
    },
    patch: {
      tags: ["Users"],
      summary: "Actualizar el perfil del usuario autenticado",
      security: bearerAuth,
      requestBody: jsonBody(ref("UpdateUserProfileRequest")),
      responses: {
        "200": okResponse("Perfil actualizado.", ref("UserProfile")),
        "401": errors.unauthorized,
        "422": errors.validation
      }
    }
  },
  "/users/{id}": {
    get: {
      tags: ["Users"],
      summary: "Obtener el perfil público de un usuario",
      description: "Público. Devuelve solo campos no sensibles (sin teléfono).",
      security: [],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }
      ],
      responses: {
        "200": okResponse("Perfil público.", ref("PublicUserProfile")),
        "404": errors.notFound,
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
        "200": {
          description: "Servicio operativo.",
          content: { "application/json": { schema: ref("HealthStatus") } }
        },
        "503": {
          description: "Base de datos no disponible.",
          content: { "application/json": { schema: ref("HealthStatus") } }
        }
      }
    }
  }
};

export const authOpenApiDocument = buildOpenApiDocument({
  title: "PetLink · Auth API",
  description:
    "API de autenticación y perfiles de usuario de PetLink. El registro es público; el resto usa un token Bearer de Supabase.",
  servers: [
    { url: PROD_SERVER, description: "Producción (Vercel)" },
    { url: LOCAL_SERVER, description: "Local" }
  ],
  tags: [
    { name: "Auth", description: "Registro y sesión." },
    { name: "Users", description: "Perfiles de usuario." },
    { name: "System", description: "Salud del servicio." }
  ],
  paths,
  schemas
});
