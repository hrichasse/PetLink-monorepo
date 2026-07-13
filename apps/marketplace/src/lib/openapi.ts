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

const PROD_SERVER = "https://petlink-marketplace.vercel.app/api/v1";
const LOCAL_SERVER = "http://localhost:3003/api/v1";

const SERVICE_TYPE = [
  "WALKING", "DAYCARE", "BOARDING", "TRAINING", "GROOMING", "PET_SITTING",
  "VETERINARY", "ONLINE_STORE", "SPA", "PET_TAXI", "OTHER"
];
const VET_SPECIALTY = [
  "GENERAL", "SURGERY", "DERMATOLOGY", "CARDIOLOGY", "OPHTHALMOLOGY", "NEUROLOGY",
  "ONCOLOGY", "DENTISTRY", "NUTRITION", "EXOTIC_PETS", "EMERGENCY", "OTHER"
];
const BOOKING_STATUS = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
const PAYMENT_PROVIDER = ["MERCADOPAGO", "TRANSBANK"];
const PAYMENT_STATUS = ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "REFUNDED", "FAILED"];
const SUBSCRIPTION_STATUS = ["PENDING", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"];
const PLAN_CODE = ["BASIC", "PREMIUM", "PROVIDER_PRO"];
const NOTIFICATION_CHANNEL = ["EMAIL", "PUSH", "IN_APP", "SMS"];

const paginationParams: Json[] = [
  { name: "page", in: "query", required: false, schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "pageSize", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } }
];

const idParam = (name: string): Json => ({
  name, in: "path", required: true, schema: { type: "string", format: "uuid" }
});

const schemas: Json = {
  Service: {
    type: "object",
    required: ["id", "providerId", "type", "title", "description", "price", "location", "isActive", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      providerId: { type: "string", format: "uuid" },
      type: { type: "string", enum: SERVICE_TYPE },
      title: { type: "string", example: "Paseo de perros en Providencia" },
      description: { type: "string" },
      price: { type: "number", example: 12000 },
      location: { type: "string", example: "Providencia, Santiago" },
      availabilityNotes: { type: "string", nullable: true },
      isActive: { type: "boolean" },
      providerName: { type: "string", nullable: true },
      providerCity: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  },
  CreateServiceRequest: {
    type: "object",
    required: ["type", "title", "description", "price", "location"],
    properties: {
      type: { type: "string", enum: SERVICE_TYPE },
      title: { type: "string", minLength: 3, maxLength: 160 },
      description: { type: "string", minLength: 10, maxLength: 2000 },
      price: { type: "number", exclusiveMinimum: 0, maximum: 1000000, example: 12000 },
      location: { type: "string", minLength: 2, maxLength: 160 },
      availabilityNotes: { type: "string", nullable: true },
      isActive: { type: "boolean" }
    }
  },
  UpdateServiceRequest: {
    type: "object",
    properties: {
      type: { type: "string", enum: SERVICE_TYPE },
      title: { type: "string", minLength: 3, maxLength: 160 },
      description: { type: "string", minLength: 10, maxLength: 2000 },
      price: { type: "number", exclusiveMinimum: 0, maximum: 1000000 },
      location: { type: "string", minLength: 2, maxLength: 160 },
      availabilityNotes: { type: "string", nullable: true },
      isActive: { type: "boolean" }
    }
  },
  Veterinary: {
    type: "object",
    required: ["id", "name", "address", "city", "specialties", "isPartner", "isActive", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      description: { type: "string", nullable: true },
      phone: { type: "string", nullable: true },
      email: { type: "string", nullable: true },
      website: { type: "string", nullable: true },
      address: { type: "string" },
      city: { type: "string", example: "Huechuraba" },
      lat: { type: "number", nullable: true },
      lng: { type: "number", nullable: true },
      specialties: { type: "array", items: { type: "string", enum: VET_SPECIALTY } },
      imageUrl: { type: "string", nullable: true },
      isPartner: { type: "boolean" },
      isActive: { type: "boolean" },
      operatingHours: { type: "object", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  },
  CreateVeterinaryRequest: {
    type: "object",
    required: ["name", "address", "city"],
    properties: {
      name: { type: "string", minLength: 2, maxLength: 200 },
      description: { type: "string", nullable: true },
      phone: { type: "string", nullable: true },
      email: { type: "string", format: "email", nullable: true },
      website: { type: "string", format: "uri", nullable: true },
      address: { type: "string", minLength: 3, maxLength: 300 },
      city: { type: "string", minLength: 2, maxLength: 100 },
      lat: { type: "number", minimum: -90, maximum: 90, nullable: true },
      lng: { type: "number", minimum: -180, maximum: 180, nullable: true },
      specialties: { type: "array", items: { type: "string", enum: VET_SPECIALTY }, minItems: 1 },
      imageUrl: { type: "string", format: "uri", nullable: true },
      isPartner: { type: "boolean" },
      isActive: { type: "boolean" },
      operatingHours: { type: "object", nullable: true }
    }
  },
  UpdateVeterinaryRequest: {
    type: "object",
    description: "Todos los campos opcionales (mismos que CreateVeterinaryRequest).",
    properties: {
      name: { type: "string", minLength: 2, maxLength: 200 },
      description: { type: "string", nullable: true },
      phone: { type: "string", nullable: true },
      email: { type: "string", format: "email", nullable: true },
      website: { type: "string", format: "uri", nullable: true },
      address: { type: "string", minLength: 3, maxLength: 300 },
      city: { type: "string", minLength: 2, maxLength: 100 },
      lat: { type: "number", nullable: true },
      lng: { type: "number", nullable: true },
      specialties: { type: "array", items: { type: "string", enum: VET_SPECIALTY }, minItems: 1 },
      imageUrl: { type: "string", format: "uri", nullable: true },
      isPartner: { type: "boolean" },
      isActive: { type: "boolean" },
      operatingHours: { type: "object", nullable: true }
    }
  },
  Booking: {
    type: "object",
    required: ["id", "petId", "serviceId", "ownerId", "providerId", "bookingDate", "status", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      petId: { type: "string", format: "uuid" },
      serviceId: { type: "string", format: "uuid" },
      ownerId: { type: "string", format: "uuid" },
      providerId: { type: "string", format: "uuid" },
      bookingDate: { type: "string", format: "date-time" },
      durationHours: { type: "integer", nullable: true },
      status: { type: "string", enum: BOOKING_STATUS },
      notes: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  },
  CreateBookingRequest: {
    type: "object",
    required: ["petId", "serviceId", "bookingDate"],
    properties: {
      petId: { type: "string", format: "uuid" },
      serviceId: { type: "string", format: "uuid" },
      bookingDate: { type: "string", format: "date-time" },
      durationHours: { type: "integer", minimum: 1, maximum: 720 },
      notes: { type: "string", nullable: true }
    }
  },
  UpdateBookingStatusRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: BOOKING_STATUS },
      notes: { type: "string", nullable: true }
    }
  },
  Review: {
    type: "object",
    required: ["id", "bookingId", "serviceId", "providerId", "authorId", "rating", "createdAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      bookingId: { type: "string", format: "uuid" },
      serviceId: { type: "string", format: "uuid" },
      providerId: { type: "string", format: "uuid" },
      authorId: { type: "string", format: "uuid" },
      rating: { type: "integer", minimum: 1, maximum: 5 },
      comment: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" }
    }
  },
  CreateReviewRequest: {
    type: "object",
    required: ["bookingId", "rating"],
    properties: {
      bookingId: { type: "string", format: "uuid" },
      rating: { type: "integer", minimum: 1, maximum: 5 },
      comment: { type: "string", nullable: true }
    }
  },
  Payment: {
    type: "object",
    required: ["id", "userId", "provider", "status", "amount", "currency", "description", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid" },
      subscriptionId: { type: "string", format: "uuid", nullable: true },
      provider: { type: "string", enum: PAYMENT_PROVIDER },
      providerPaymentId: { type: "string", nullable: true },
      providerReference: { type: "string", nullable: true },
      status: { type: "string", enum: PAYMENT_STATUS },
      amount: { type: "number", example: 9900 },
      currency: { type: "string", example: "CLP" },
      description: { type: "string" },
      paymentMethod: { type: "string", nullable: true },
      paidAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  },
  CreateCheckoutRequest: {
    type: "object",
    required: ["planCode", "provider"],
    properties: {
      planCode: { type: "string", enum: PLAN_CODE },
      provider: { type: "string", enum: PAYMENT_PROVIDER },
      subscriptionId: { type: "string", format: "uuid" },
      autoRenew: { type: "boolean" },
      successUrl: { type: "string", format: "uri" },
      cancelUrl: { type: "string", format: "uri" }
    }
  },
  CheckoutResponse: {
    type: "object",
    required: ["payment"],
    properties: {
      payment: ref("Payment"),
      checkoutUrl: { type: "string", nullable: true, description: "URL de pago del proveedor a la que redirigir." },
      providerPaymentId: { type: "string", nullable: true },
      providerReference: { type: "string", nullable: true }
    }
  },
  ConfirmPaymentRequest: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["APPROVED", "REJECTED", "CANCELLED", "FAILED"] },
      providerPaymentId: { type: "string", nullable: true },
      providerReference: { type: "string", nullable: true },
      paymentMethod: { type: "string", nullable: true },
      metadata: { type: "object" }
    }
  },
  Subscription: {
    type: "object",
    required: ["id", "planCode", "status", "autoRenew", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      planCode: { type: "string", enum: PLAN_CODE },
      status: { type: "string", enum: SUBSCRIPTION_STATUS },
      startDate: { type: "string", format: "date-time", nullable: true },
      endDate: { type: "string", format: "date-time", nullable: true },
      autoRenew: { type: "boolean" },
      provider: { type: "string", enum: PAYMENT_PROVIDER, nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" }
    }
  },
  CreateSubscriptionRequest: {
    type: "object",
    required: ["planCode"],
    properties: {
      planCode: { type: "string", enum: PLAN_CODE },
      provider: { type: "string", enum: PAYMENT_PROVIDER },
      autoRenew: { type: "boolean" }
    }
  },
  AskAssistantRequest: {
    type: "object",
    required: ["question"],
    properties: {
      question: { type: "string", minLength: 3, maxLength: 1000, example: "¿Cada cuánto debo desparasitar a mi gato?" },
      history: {
        type: "array",
        maxItems: 10,
        description: "Turnos recientes para contexto multi-turno.",
        items: {
          type: "object",
          required: ["role", "text"],
          properties: {
            role: { type: "string", enum: ["user", "model"] },
            text: { type: "string", minLength: 1, maxLength: 4000 }
          }
        }
      }
    }
  },
  AssistantAnswer: {
    type: "object",
    required: ["answer", "used", "limit", "remaining"],
    properties: {
      answer: { type: "string" },
      used: { type: "integer", example: 3 },
      limit: { type: "integer", example: 5 },
      remaining: { type: "integer", example: 2 },
      planCode: { type: "string", nullable: true, enum: [...PLAN_CODE, null] }
    }
  },
  AssistantUsage: {
    type: "object",
    required: ["used", "limit", "remaining"],
    properties: {
      used: { type: "integer" },
      limit: { type: "integer" },
      remaining: { type: "integer" },
      planCode: { type: "string", nullable: true }
    }
  },
  SendNotificationRequest: {
    type: "object",
    required: ["channel", "title", "message"],
    properties: {
      channel: { type: "string", enum: NOTIFICATION_CHANNEL },
      title: { type: "string" },
      message: { type: "string" },
      eventType: { type: "string" },
      payload: { type: "object" }
    }
  },
  RecommendationRequest: {
    type: "object",
    properties: {
      context: { type: "string", description: "Contexto para el motor de recomendaciones." },
      petId: { type: "string", format: "uuid" },
      city: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 50 },
      metadata: { type: "object" }
    }
  },
  HealthStatus: {
    type: "object",
    properties: {
      status: { type: "string", example: "ok" },
      app: { type: "string", example: "marketplace" },
      db: { type: "string", example: "connected" }
    }
  }
};

const paths: Json = {
  "/services": {
    get: {
      tags: ["Services"],
      summary: "Listar servicios (público, paginado)",
      security: [],
      parameters: [
        ...paginationParams,
        { name: "type", in: "query", required: false, schema: { type: "string", enum: SERVICE_TYPE } },
        { name: "location", in: "query", required: false, schema: { type: "string" } },
        { name: "providerId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
        { name: "isActive", in: "query", required: false, schema: { type: "boolean" } }
      ],
      responses: { "200": okListResponse("Página de servicios.", ref("Service"), true) }
    },
    post: {
      tags: ["Services"],
      summary: "Publicar un servicio",
      security: bearerAuth,
      requestBody: jsonBody(ref("CreateServiceRequest")),
      responses: {
        "201": okResponse("Servicio creado.", ref("Service")),
        "401": errors.unauthorized,
        "422": errors.validation
      }
    }
  },
  "/services/{id}": {
    get: {
      tags: ["Services"],
      summary: "Obtener un servicio (público)",
      security: [],
      parameters: [idParam("id")],
      responses: { "200": okResponse("Servicio.", ref("Service")), "404": errors.notFound }
    },
    patch: {
      tags: ["Services"],
      summary: "Actualizar un servicio (proveedor dueño)",
      security: bearerAuth,
      parameters: [idParam("id")],
      requestBody: jsonBody(ref("UpdateServiceRequest")),
      responses: {
        "200": okResponse("Servicio actualizado.", ref("Service")),
        "401": errors.unauthorized, "403": errors.forbidden, "404": errors.notFound, "422": errors.validation
      }
    },
    delete: {
      tags: ["Services"],
      summary: "Eliminar un servicio (proveedor dueño)",
      security: bearerAuth,
      parameters: [idParam("id")],
      responses: {
        "200": okResponse("Servicio eliminado.", { type: "object" }),
        "401": errors.unauthorized, "403": errors.forbidden, "404": errors.notFound
      }
    }
  },
  "/veterinaries": {
    get: {
      tags: ["Veterinaries"],
      summary: "Listar veterinarias (público, paginado)",
      security: [],
      parameters: [
        ...paginationParams,
        { name: "city", in: "query", required: false, schema: { type: "string" } },
        { name: "specialty", in: "query", required: false, schema: { type: "string", enum: VET_SPECIALTY } },
        { name: "isPartner", in: "query", required: false, schema: { type: "boolean" } },
        { name: "isActive", in: "query", required: false, schema: { type: "boolean" } }
      ],
      responses: { "200": okListResponse("Página de veterinarias.", ref("Veterinary"), true) }
    },
    post: {
      tags: ["Veterinaries"],
      summary: "Crear una veterinaria",
      security: bearerAuth,
      requestBody: jsonBody(ref("CreateVeterinaryRequest")),
      responses: {
        "201": okResponse("Veterinaria creada.", ref("Veterinary")),
        "401": errors.unauthorized, "422": errors.validation
      }
    }
  },
  "/veterinaries/{id}": {
    get: {
      tags: ["Veterinaries"],
      summary: "Obtener una veterinaria (público)",
      security: [],
      parameters: [idParam("id")],
      responses: { "200": okResponse("Veterinaria.", ref("Veterinary")), "404": errors.notFound }
    },
    patch: {
      tags: ["Veterinaries"],
      summary: "Actualizar una veterinaria",
      security: bearerAuth,
      parameters: [idParam("id")],
      requestBody: jsonBody(ref("UpdateVeterinaryRequest")),
      responses: {
        "200": okResponse("Veterinaria actualizada.", ref("Veterinary")),
        "401": errors.unauthorized, "404": errors.notFound, "422": errors.validation
      }
    },
    delete: {
      tags: ["Veterinaries"],
      summary: "Eliminar una veterinaria",
      security: bearerAuth,
      parameters: [idParam("id")],
      responses: {
        "200": okResponse("Veterinaria eliminada.", { type: "object" }),
        "401": errors.unauthorized, "404": errors.notFound
      }
    }
  },
  "/bookings": {
    get: {
      tags: ["Bookings"],
      summary: "Listar mis reservas (paginado)",
      description: "Devuelve las reservas donde el usuario es dueño o proveedor. Filtra con `role`.",
      security: bearerAuth,
      parameters: [
        ...paginationParams,
        { name: "role", in: "query", required: false, schema: { type: "string", enum: ["owner", "provider"] } }
      ],
      responses: { "200": okListResponse("Página de reservas.", ref("Booking"), true), "401": errors.unauthorized }
    },
    post: {
      tags: ["Bookings"],
      summary: "Crear una reserva",
      security: bearerAuth,
      requestBody: jsonBody(ref("CreateBookingRequest")),
      responses: {
        "201": okResponse("Reserva creada.", ref("Booking")),
        "401": errors.unauthorized, "404": errors.notFound, "422": errors.validation
      }
    }
  },
  "/bookings/{id}": {
    get: {
      tags: ["Bookings"],
      summary: "Obtener una reserva",
      security: bearerAuth,
      parameters: [idParam("id")],
      responses: { "200": okResponse("Reserva.", ref("Booking")), "401": errors.unauthorized, "404": errors.notFound }
    },
    delete: {
      tags: ["Bookings"],
      summary: "Cancelar una reserva",
      security: bearerAuth,
      parameters: [idParam("id")],
      responses: {
        "200": okResponse("Reserva cancelada.", ref("Booking")),
        "401": errors.unauthorized, "403": errors.forbidden, "404": errors.notFound
      }
    }
  },
  "/bookings/{id}/status": {
    patch: {
      tags: ["Bookings"],
      summary: "Cambiar el estado de una reserva (proveedor)",
      security: bearerAuth,
      parameters: [idParam("id")],
      requestBody: jsonBody(ref("UpdateBookingStatusRequest")),
      responses: {
        "200": okResponse("Estado actualizado.", ref("Booking")),
        "401": errors.unauthorized, "403": errors.forbidden, "404": errors.notFound, "422": errors.validation
      }
    }
  },
  "/reviews": {
    post: {
      tags: ["Reviews"],
      summary: "Crear una reseña (tras una reserva completada)",
      security: bearerAuth,
      requestBody: jsonBody(ref("CreateReviewRequest")),
      responses: {
        "201": okResponse("Reseña creada.", ref("Review")),
        "401": errors.unauthorized, "404": errors.notFound, "422": errors.validation
      }
    }
  },
  "/reviews/provider/{providerId}": {
    get: {
      tags: ["Reviews"],
      summary: "Listar reseñas de un proveedor (público, paginado)",
      security: [],
      parameters: [idParam("providerId"), ...paginationParams],
      responses: { "200": okListResponse("Página de reseñas.", ref("Review"), true) }
    }
  },
  "/reviews/service/{serviceId}": {
    get: {
      tags: ["Reviews"],
      summary: "Listar reseñas de un servicio (público, paginado)",
      security: [],
      parameters: [idParam("serviceId"), ...paginationParams],
      responses: { "200": okListResponse("Página de reseñas.", ref("Review"), true) }
    }
  },
  "/payments/checkout": {
    post: {
      tags: ["Payments"],
      summary: "Crear un checkout de pago para un plan",
      security: bearerAuth,
      requestBody: jsonBody(ref("CreateCheckoutRequest")),
      responses: {
        "201": okResponse("Checkout creado.", ref("CheckoutResponse")),
        "401": errors.unauthorized, "422": errors.validation
      }
    }
  },
  "/payments/my": {
    get: {
      tags: ["Payments"],
      summary: "Listar mis pagos (paginado)",
      security: bearerAuth,
      parameters: paginationParams,
      responses: { "200": okListResponse("Página de pagos.", ref("Payment"), true), "401": errors.unauthorized }
    }
  },
  "/payments/{id}": {
    get: {
      tags: ["Payments"],
      summary: "Obtener un pago",
      security: bearerAuth,
      parameters: [idParam("id")],
      responses: { "200": okResponse("Pago.", ref("Payment")), "401": errors.unauthorized, "404": errors.notFound }
    }
  },
  "/payments/{id}/confirm": {
    post: {
      tags: ["Payments"],
      summary: "Confirmar/actualizar el estado de un pago",
      security: bearerAuth,
      parameters: [idParam("id")],
      requestBody: jsonBody(ref("ConfirmPaymentRequest")),
      responses: {
        "200": okResponse("Pago actualizado.", ref("Payment")),
        "401": errors.unauthorized, "404": errors.notFound, "422": errors.validation
      }
    }
  },
  "/payments/webhook/{provider}": {
    post: {
      tags: ["Payments"],
      summary: "Webhook del proveedor de pagos (público)",
      description: "Recibido server-to-server desde MercadoPago/Transbank. No requiere Bearer; se valida por proveedor.",
      security: [],
      parameters: [{ name: "provider", in: "path", required: true, schema: { type: "string", enum: PAYMENT_PROVIDER } }],
      requestBody: jsonBody({ type: "object", description: "Payload nativo del proveedor (passthrough)." }, false),
      responses: { "200": { description: "Webhook procesado." }, "400": errors.badRequest }
    }
  },
  "/payments/transbank/return": {
    get: {
      tags: ["Payments"],
      summary: "Retorno de Transbank (redirección del usuario)",
      security: [],
      parameters: [{ name: "token_ws", in: "query", required: false, schema: { type: "string" } }],
      responses: { "302": { description: "Redirige de vuelta a la app web." } }
    },
    post: {
      tags: ["Payments"],
      summary: "Retorno de Transbank (form POST)",
      security: [],
      responses: { "302": { description: "Redirige de vuelta a la app web." } }
    }
  },
  "/subscriptions": {
    post: {
      tags: ["Subscriptions"],
      summary: "Crear una suscripción",
      security: bearerAuth,
      requestBody: jsonBody(ref("CreateSubscriptionRequest")),
      responses: {
        "201": okResponse("Suscripción creada.", ref("Subscription")),
        "401": errors.unauthorized, "422": errors.validation
      }
    }
  },
  "/subscriptions/me": {
    get: {
      tags: ["Subscriptions"],
      summary: "Obtener mi suscripción activa",
      security: bearerAuth,
      responses: {
        "200": okResponse("Suscripción activa (o null).", { oneOf: [ref("Subscription"), { type: "null" }] }),
        "401": errors.unauthorized
      }
    }
  },
  "/subscriptions/{id}/cancel": {
    patch: {
      tags: ["Subscriptions"],
      summary: "Cancelar una suscripción",
      security: bearerAuth,
      parameters: [idParam("id")],
      responses: {
        "200": okResponse("Suscripción cancelada.", ref("Subscription")),
        "401": errors.unauthorized, "404": errors.notFound
      }
    }
  },
  "/assistant/ask": {
    post: {
      tags: ["PetAsistance"],
      summary: "Preguntar al asistente IA (consume cuota diaria del plan)",
      description:
        "Cuota diaria por plan: Free 5, Basic 15, Premium 35, Provider Pro 80. Devuelve 429 al agotarla. La cuota solo se consume si el modelo responde. Rate limit por IP: 20/min.",
      security: bearerAuth,
      requestBody: jsonBody(ref("AskAssistantRequest")),
      responses: {
        "200": okResponse("Respuesta del asistente.", ref("AssistantAnswer")),
        "401": errors.unauthorized,
        "422": errors.validation,
        "429": errors.tooManyRequests
      }
    }
  },
  "/assistant/usage": {
    get: {
      tags: ["PetAsistance"],
      summary: "Consultar el uso/cuota diaria del asistente",
      security: bearerAuth,
      responses: { "200": okResponse("Uso actual.", ref("AssistantUsage")), "401": errors.unauthorized }
    }
  },
  "/notifications": {
    post: {
      tags: ["Internal"],
      summary: "Enviar una notificación (uso interno)",
      description: "Proxy a la Edge Function de notificaciones. Requiere sesión.",
      security: bearerAuth,
      requestBody: jsonBody(ref("SendNotificationRequest")),
      responses: {
        "200": okResponse("Notificación enviada.", { type: "object" }),
        "401": errors.unauthorized
      }
    }
  },
  "/recommendations": {
    post: {
      tags: ["Internal"],
      summary: "Obtener recomendaciones (uso interno)",
      description: "Proxy a la Edge Function de recomendaciones. Requiere sesión.",
      security: bearerAuth,
      requestBody: jsonBody(ref("RecommendationRequest"), false),
      responses: {
        "200": okResponse("Recomendaciones.", { type: "object" }),
        "401": errors.unauthorized
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

export const marketplaceOpenApiDocument = buildOpenApiDocument({
  title: "PetLink · Marketplace API",
  description:
    "API del marketplace de PetLink: servicios, veterinarias, reservas, pagos (MercadoPago/Transbank), suscripciones, reseñas y el asistente IA PetAsistance. Los listados de servicios, veterinarias y reseñas son públicos; el resto requiere token Bearer de Supabase.",
  servers: [
    { url: PROD_SERVER, description: "Producción (Vercel)" },
    { url: LOCAL_SERVER, description: "Local" }
  ],
  tags: [
    { name: "Services", description: "Servicios ofrecidos por proveedores." },
    { name: "Veterinaries", description: "Directorio de veterinarias." },
    { name: "Bookings", description: "Reservas de servicios." },
    { name: "Reviews", description: "Reseñas de servicios y proveedores." },
    { name: "Payments", description: "Checkout, pagos y webhooks." },
    { name: "Subscriptions", description: "Suscripciones y planes." },
    { name: "PetAsistance", description: "Asistente IA para dudas sobre mascotas." },
    { name: "Internal", description: "Endpoints de uso interno (proxies a Edge Functions)." },
    { name: "System", description: "Salud del servicio." }
  ],
  paths,
  schemas
});
