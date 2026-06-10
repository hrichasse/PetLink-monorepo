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

const serviceSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    providerId: { type: "string", format: "uuid" },
    type: { type: "string", enum: ["WALKING", "DAYCARE", "BOARDING", "TRAINING", "GROOMING", "PET_SITTING", "VETERINARY", "ONLINE_STORE", "SPA", "PET_TAXI", "OTHER"] },
    title: { type: "string" },
    description: { type: "string" },
    price: { type: "number" },
    location: { type: "string" },
    availabilityNotes: { type: ["string", "null"] },
    isActive: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "providerId", "type", "title", "description", "price", "location", "isActive", "createdAt", "updatedAt"],
  additionalProperties: false
};

const bookingSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    petId: { type: "string", format: "uuid" },
    serviceId: { type: "string", format: "uuid" },
    ownerId: { type: "string", format: "uuid" },
    providerId: { type: "string", format: "uuid" },
    bookingDate: { type: "string", format: "date-time" },
    durationHours: { type: ["integer", "null"] },
    status: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] },
    notes: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "petId", "serviceId", "ownerId", "providerId", "bookingDate", "status", "createdAt", "updatedAt"],
  additionalProperties: false
};

const reviewSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    bookingId: { type: "string", format: "uuid" },
    serviceId: { type: "string", format: "uuid" },
    providerId: { type: "string", format: "uuid" },
    authorId: { type: "string", format: "uuid" },
    rating: { type: "integer", minimum: 1, maximum: 5 },
    comment: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" }
  },
  required: ["id", "bookingId", "serviceId", "providerId", "authorId", "rating", "createdAt"],
  additionalProperties: false
};

const subscriptionSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    planCode: { type: "string" },
    status: { type: "string", enum: ["PENDING", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"] },
    startDate: { type: ["string", "null"], format: "date-time" },
    endDate: { type: ["string", "null"], format: "date-time" },
    autoRenew: { type: "boolean" },
    provider: { type: ["string", "null"], enum: ["MERCADOPAGO", "TRANSBANK"] },
    externalCustomerId: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "userId", "planCode", "status", "autoRenew", "createdAt", "updatedAt"],
  additionalProperties: false
};

const paymentSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    subscriptionId: { type: ["string", "null"], format: "uuid" },
    provider: { type: "string", enum: ["MERCADOPAGO", "TRANSBANK"] },
    providerPaymentId: { type: ["string", "null"] },
    providerReference: { type: ["string", "null"] },
    status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "REFUNDED", "FAILED"] },
    amount: { type: "number" },
    currency: { type: "string" },
    description: { type: "string" },
    paymentMethod: { type: ["string", "null"] },
    paidAt: { type: ["string", "null"], format: "date-time" },
    metadata: { type: ["object", "null"], additionalProperties: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "userId", "provider", "status", "amount", "currency", "description", "createdAt", "updatedAt"],
  additionalProperties: false
};

const veterinarySchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    description: { type: ["string", "null"] },
    phone: { type: ["string", "null"] },
    email: { type: ["string", "null"], format: "email" },
    website: { type: ["string", "null"], format: "uri" },
    address: { type: "string" },
    city: { type: "string" },
    lat: { type: ["number", "null"] },
    lng: { type: ["number", "null"] },
    specialties: { type: "array", items: { type: "string" } },
    imageUrl: { type: ["string", "null"], format: "uri" },
    isPartner: { type: "boolean" },
    isActive: { type: "boolean" },
    operatingHours: { type: ["object", "null"], additionalProperties: true },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" }
  },
  required: ["id", "name", "address", "city", "specialties", "isPartner", "isActive", "createdAt", "updatedAt"],
  additionalProperties: false
};

const notificationSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    recipientId: { type: "string", format: "uuid" },
    channel: { type: "string", enum: ["EMAIL", "PUSH", "IN_APP", "SMS"] },
    status: { type: "string", enum: ["QUEUED", "SENT", "FAILED"] },
    title: { type: "string" },
    message: { type: "string" },
    payload: { type: ["object", "null"], additionalProperties: true },
    sentAt: { type: ["string", "null"], format: "date-time" },
    createdAt: { type: "string", format: "date-time" }
  },
  required: ["id", "recipientId", "channel", "status", "title", "message", "createdAt"],
  additionalProperties: false
};

// ─── Overrides ───────────────────────────────────────────────────────────────

const marketplaceOverrides: OpenApiOverrides = {
  "GET /api/v1": {
    summary: "Marketplace service status",
    description: "Returns a basic status payload for the Marketplace API.",
    security: [],
    responses: {
      "200": {
        description: "Marketplace API status.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string", example: "PetLink marketplace API" },
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
      "500": std["500"]
    }
  },
  "GET /api/v1/health": {
    summary: "Health check",
    description: "Checks if the Marketplace API is up and responding.",
    security: [],
    responses: {
      "200": {
        description: "Marketplace API health status.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string", example: "PetLink marketplace API" },
                status: { type: "string", example: "ok" },
                timestamp: { type: "string", example: "2026-06-06T06:56:59.000Z" }
              },
              required: ["name", "status", "timestamp"],
              additionalProperties: false
            }
          }
        }
      },
      "500": std["500"]
    }
  },

  // ── Services ───────────────────────────────────────────────────────────────
  "POST /api/v1/services": {
    summary: "Create service",
    description: "Creates a provider service listing.",
    tags: ["Services"],
    requestBody: {
      required: true,
      description: "Service creation payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["WALKING", "DAYCARE", "BOARDING", "TRAINING", "GROOMING", "PET_SITTING", "VETERINARY", "ONLINE_STORE", "SPA", "PET_TAXI", "OTHER"] },
              title: { type: "string", minLength: 3, maxLength: 160 },
              description: { type: "string", minLength: 10, maxLength: 2000 },
              price: { type: "number", exclusiveMinimum: 0, maximum: 1000000 },
              location: { type: "string", minLength: 2, maxLength: 160 },
              availabilityNotes: { type: ["string", "null"] },
              isActive: { type: "boolean", default: true }
            },
            required: ["type", "title", "description", "price", "location"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "201": { description: "Service created.", content: { "application/json": { schema: okResp("Service created successfully.", serviceSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "GET /api/v1/services": {
    summary: "List services",
    description: "Lists services with optional filters such as type and location.",
    tags: ["Services"],
    parameters: [
      { name: "type", in: "query", required: false, schema: { type: "string", enum: ["WALKING", "DAYCARE", "BOARDING", "TRAINING", "GROOMING", "PET_SITTING", "VETERINARY", "ONLINE_STORE", "SPA", "PET_TAXI", "OTHER"] } },
      { name: "location", in: "query", required: false, schema: { type: "string" } },
      { name: "providerId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
      { name: "isActive", in: "query", required: false, schema: { type: "string", enum: ["true", "false"] } }
    ],
    responses: {
      "200": { description: "Services list.", content: { "application/json": { schema: okResp("Services fetched successfully.", { type: "array", items: serviceSchema }) } } },
      "401": std["401"],
      "500": std["500"]
    }
  },
  "GET /api/v1/services/{id}": {
    summary: "Get service by id",
    description: "Returns a single service listing.",
    tags: ["Services"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Service details.", content: { "application/json": { schema: okResp("Service fetched successfully.", serviceSchema) } } },
      "401": std["401"],
      "404": std["404"],
      "500": std["500"]
    }
  },
  "PATCH /api/v1/services/{id}": {
    summary: "Update service",
    description: "Updates a provider service listing.",
    tags: ["Services"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      required: true,
      description: "Fields to update (all optional).",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["WALKING", "DAYCARE", "BOARDING", "TRAINING", "GROOMING", "PET_SITTING", "VETERINARY", "ONLINE_STORE", "SPA", "PET_TAXI", "OTHER"] },
              title: { type: "string", minLength: 3, maxLength: 160 },
              description: { type: "string", minLength: 10, maxLength: 2000 },
              price: { type: "number", exclusiveMinimum: 0, maximum: 1000000 },
              location: { type: "string", minLength: 2, maxLength: 160 },
              availabilityNotes: { type: ["string", "null"] },
              isActive: { type: "boolean" }
            },
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "200": { description: "Service updated.", content: { "application/json": { schema: okResp("Service updated successfully.", serviceSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "DELETE /api/v1/services/{id}": {
    summary: "Delete service",
    description: "Deletes a provider service listing.",
    tags: ["Services"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Service deleted.", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string", example: "Service deleted successfully." } }, required: ["success", "message"], additionalProperties: false } } } },
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "500": std["500"]
    }
  },

  // ── Bookings ───────────────────────────────────────────────────────────────
  "POST /api/v1/bookings": {
    summary: "Create booking",
    description: "Creates a booking for a selected service and pet.",
    tags: ["Bookings"],
    requestBody: {
      required: true,
      description: "Booking creation payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              petId: { type: "string", format: "uuid" },
              serviceId: { type: "string", format: "uuid" },
              bookingDate: { type: "string", format: "date-time" },
              durationHours: { type: "integer", minimum: 1, maximum: 720 },
              notes: { type: ["string", "null"] }
            },
            required: ["petId", "serviceId", "bookingDate"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "201": { description: "Booking created.", content: { "application/json": { schema: okResp("Booking created successfully.", bookingSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "GET /api/v1/bookings": {
    summary: "List bookings",
    description: "Lists bookings for the authenticated user or provider.",
    tags: ["Bookings"],
    parameters: [
      { name: "role", in: "query", required: false, schema: { type: "string", enum: ["owner", "provider"] } }
    ],
    responses: {
      "200": { description: "Bookings list.", content: { "application/json": { schema: okResp("Bookings fetched successfully.", { type: "array", items: bookingSchema }) } } },
      "401": std["401"],
      "500": std["500"]
    }
  },
  "GET /api/v1/bookings/{id}": {
    summary: "Get booking by id",
    description: "Returns booking detail for an authorized user.",
    tags: ["Bookings"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Booking details.", content: { "application/json": { schema: okResp("Booking fetched successfully.", bookingSchema) } } },
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "500": std["500"]
    }
  },
  "DELETE /api/v1/bookings/{id}": {
    summary: "Cancel booking",
    description: "Cancels or deletes a booking when the current user is allowed to do so.",
    tags: ["Bookings"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Booking cancelled.", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string", example: "Booking cancelled successfully." } }, required: ["success", "message"], additionalProperties: false } } } },
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "500": std["500"]
    }
  },
  "PATCH /api/v1/bookings/{id}/status": {
    summary: "Update booking status",
    description: "Updates the booking status from the provider workflow.",
    tags: ["Bookings"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      required: true,
      description: "Status update payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"] },
              notes: { type: ["string", "null"] }
            },
            required: ["status"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "200": { description: "Booking status updated.", content: { "application/json": { schema: okResp("Booking status updated successfully.", bookingSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "422": std["422"],
      "500": std["500"]
    }
  },

  // ── Reviews ────────────────────────────────────────────────────────────────
  "POST /api/v1/reviews": {
    summary: "Create review",
    description: "Creates a review associated with a provider or service.",
    tags: ["Reviews"],
    requestBody: {
      required: true,
      description: "Review creation payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              bookingId: { type: "string", format: "uuid" },
              rating: { type: "integer", minimum: 1, maximum: 5 },
              comment: { type: ["string", "null"] }
            },
            required: ["bookingId", "rating"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "201": { description: "Review created.", content: { "application/json": { schema: okResp("Review created successfully.", reviewSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "GET /api/v1/reviews/service/{serviceId}": {
    summary: "List service reviews",
    description: "Returns all reviews for a service.",
    tags: ["Reviews"],
    parameters: [{ name: "serviceId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Reviews list.", content: { "application/json": { schema: okResp("Reviews fetched successfully.", { type: "array", items: reviewSchema }) } } },
      "401": std["401"],
      "404": std["404"],
      "500": std["500"]
    }
  },
  "GET /api/v1/reviews/provider/{providerId}": {
    summary: "List provider reviews",
    description: "Returns all reviews for a provider.",
    tags: ["Reviews"],
    parameters: [{ name: "providerId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Reviews list.", content: { "application/json": { schema: okResp("Reviews fetched successfully.", { type: "array", items: reviewSchema }) } } },
      "401": std["401"],
      "404": std["404"],
      "500": std["500"]
    }
  },

  // ── Subscriptions ──────────────────────────────────────────────────────────
  "POST /api/v1/subscriptions": {
    summary: "Create subscription",
    description: "Creates a subscription for the selected plan.",
    tags: ["Subscriptions"],
    requestBody: {
      required: true,
      description: "Subscription creation payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              planCode: { type: "string", enum: ["BASIC", "PREMIUM", "PROVIDER_PRO"] },
              provider: { type: "string", enum: ["MERCADOPAGO", "TRANSBANK"] },
              autoRenew: { type: "boolean" }
            },
            required: ["planCode"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "201": { description: "Subscription created.", content: { "application/json": { schema: okResp("Subscription created successfully.", subscriptionSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "GET /api/v1/subscriptions/me": {
    summary: "Get active subscription",
    description: "Returns the active subscription for the authenticated user.",
    tags: ["Subscriptions"],
    responses: {
      "200": { description: "Active subscription.", content: { "application/json": { schema: okResp("Subscription fetched successfully.", subscriptionSchema) } } },
      "401": std["401"],
      "404": std["404"],
      "500": std["500"]
    }
  },
  "PATCH /api/v1/subscriptions/{id}/cancel": {
    summary: "Cancel subscription",
    description: "Cancels a manageable subscription for the authenticated user.",
    tags: ["Subscriptions"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Subscription cancelled.", content: { "application/json": { schema: okResp("Subscription cancelled successfully.", subscriptionSchema) } } },
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "500": std["500"]
    }
  },

  // ── Payments ───────────────────────────────────────────────────────────────
  "POST /api/v1/payments/checkout": {
    summary: "Create payment checkout",
    description: "Initializes a checkout session for the selected provider and subscription or purchase.",
    tags: ["Payments"],
    requestBody: {
      required: true,
      description: "Checkout initialization payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              planCode: { type: "string", enum: ["BASIC", "PREMIUM", "PROVIDER_PRO"] },
              provider: { type: "string", enum: ["MERCADOPAGO", "TRANSBANK"] },
              subscriptionId: { type: "string", format: "uuid" },
              autoRenew: { type: "boolean" },
              successUrl: { type: "string", format: "uri" },
              cancelUrl: { type: "string", format: "uri" }
            },
            required: ["planCode", "provider"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "201": { description: "Checkout session created.", content: { "application/json": { schema: okResp("Payment checkout initialized.", paymentSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "GET /api/v1/payments/my": {
    summary: "List my payments",
    description: "Returns payment history for the authenticated user.",
    tags: ["Payments"],
    responses: {
      "200": { description: "Payment history.", content: { "application/json": { schema: okResp("Payments fetched successfully.", { type: "array", items: paymentSchema }) } } },
      "401": std["401"],
      "500": std["500"]
    }
  },
  "GET /api/v1/payments/{id}": {
    summary: "Get payment by id",
    description: "Returns a payment detail by id.",
    tags: ["Payments"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Payment details.", content: { "application/json": { schema: okResp("Payment fetched successfully.", paymentSchema) } } },
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "500": std["500"]
    }
  },
  "POST /api/v1/payments/{id}/confirm": {
    summary: "Confirm payment",
    description: "Confirms the payment result and persists the final state.",
    tags: ["Payments"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      required: true,
      description: "Payment confirmation payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["APPROVED", "REJECTED", "CANCELLED", "FAILED"] },
              providerPaymentId: { type: ["string", "null"] },
              providerReference: { type: ["string", "null"] },
              paymentMethod: { type: ["string", "null"] },
              metadata: { type: "object", additionalProperties: true }
            },
            required: ["status"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "200": { description: "Payment confirmed.", content: { "application/json": { schema: okResp("Payment confirmed successfully.", paymentSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "GET /api/v1/payments/transbank/return": {
    summary: "Transbank return callback",
    description: "Receives the browser redirect after a Transbank checkout flow.",
    tags: ["Payments"],
    security: [],
    responses: {
      "200": { description: "Transbank return handled.", content: { "application/json": { schema: okResp("Transbank return processed.", { type: "object", additionalProperties: true }) } } },
      "500": std["500"]
    }
  },
  "POST /api/v1/payments/transbank/return": {
    summary: "Transbank return callback (POST)",
    description: "Handles POST callbacks from Transbank after checkout completion.",
    tags: ["Payments"],
    security: [],
    requestBody: {
      required: false,
      description: "Transbank callback payload.",
      content: {
        "application/x-www-form-urlencoded": { schema: { type: "object", additionalProperties: true } }
      }
    },
    responses: {
      "200": { description: "Transbank return handled.", content: { "application/json": { schema: okResp("Transbank return processed.", { type: "object", additionalProperties: true }) } } },
      "500": std["500"]
    }
  },
  "POST /api/v1/payments/webhook/{provider}": {
    summary: "Payment webhook",
    description: "Receives provider webhook notifications for asynchronous payment updates.",
    tags: ["Payments"],
    security: [],
    parameters: [{ name: "provider", in: "path", required: true, schema: { type: "string", enum: ["mercadopago", "transbank"] } }],
    requestBody: {
      required: true,
      description: "Webhook payload from the provider.",
      content: { "application/json": { schema: { type: "object", additionalProperties: true } } }
    },
    responses: {
      "200": { description: "Webhook processed.", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true } } } } } },
      "500": std["500"]
    }
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  "POST /api/v1/notifications": {
    summary: "Create notification",
    description: "Creates and dispatches a notification entry.",
    tags: ["Notifications"],
    requestBody: {
      required: true,
      description: "Notification creation payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              channel: { type: "string", enum: ["EMAIL", "PUSH", "IN_APP", "SMS"] },
              title: { type: "string" },
              message: { type: "string" },
              eventType: { type: "string", enum: ["BOOKING_CREATED", "BOOKING_CONFIRMED", "BOOKING_CANCELLED", "BOOKING_COMPLETED", "HEALTH_REMINDER", "SYSTEM"] },
              payload: { type: ["object", "null"], additionalProperties: true }
            },
            required: ["channel", "title", "message", "eventType"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "201": { description: "Notification created.", content: { "application/json": { schema: okResp("Notification created successfully.", notificationSchema) } } },
      "400": std["400"],
      "401": std["401"],
      "422": std["422"],
      "500": std["500"]
    }
  },

  // ── Recommendations ────────────────────────────────────────────────────────
  "POST /api/v1/recommendations": {
    summary: "Get recommendations",
    description: "Returns recommended services or providers for the current user.",
    tags: ["Recommendations"],
    requestBody: {
      required: true,
      description: "Recommendation criteria.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              context: { type: "string", enum: ["SERVICES", "MATCH", "HEALTH"] },
              petId: { type: "string", format: "uuid" },
              city: { type: ["string", "null"] },
              limit: { type: "integer", default: 10 },
              metadata: { type: "object", additionalProperties: true }
            },
            required: ["context"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "200": { description: "Recommendations list.", content: { "application/json": { schema: okResp("Recommendations fetched successfully.", { type: "array", items: serviceSchema }) } } },
      "400": std["400"],
      "401": std["401"],
      "500": std["500"]
    }
  },

  // ── Veterinaries ───────────────────────────────────────────────────────────
  "POST /api/v1/veterinaries": {
    summary: "Create veterinary profile",
    description: "Creates a veterinary listing.",
    tags: ["Veterinaries"],
    requestBody: {
      required: true,
      description: "Veterinary creation payload.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string", minLength: 2, maxLength: 200 },
              description: { type: ["string", "null"], maxLength: 2000 },
              phone: { type: ["string", "null"], maxLength: 30 },
              email: { type: ["string", "null"], format: "email", maxLength: 160 },
              website: { type: ["string", "null"], format: "uri", maxLength: 300 },
              address: { type: "string", minLength: 3, maxLength: 300 },
              city: { type: "string", minLength: 2, maxLength: 100 },
              lat: { type: ["number", "null"], minimum: -90, maximum: 90 },
              lng: { type: ["number", "null"], minimum: -180, maximum: 180 },
              specialties: { type: "array", items: { type: "string", enum: ["GENERAL", "SURGERY", "DERMATOLOGY", "CARDIOLOGY", "OPHTHALMOLOGY", "NEUROLOGY", "ONCOLOGY", "DENTISTRY", "NUTRITION", "EXOTIC_PETS", "EMERGENCY", "OTHER"] }, minItems: 1 },
              imageUrl: { type: ["string", "null"], format: "uri", maxLength: 500 },
              isPartner: { type: "boolean", default: false },
              isActive: { type: "boolean" },
              operatingHours: { type: ["object", "null"], additionalProperties: true }
            },
            required: ["name", "address", "city"],
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "201": { description: "Veterinary created.", content: { "application/json": { schema: okResp("Veterinary created successfully.", veterinarySchema) } } },
      "400": std["400"],
      "401": std["401"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "GET /api/v1/veterinaries": {
    summary: "List veterinaries",
    description: "Returns veterinary listings with optional filters.",
    tags: ["Veterinaries"],
    parameters: [
      { name: "city", in: "query", required: false, schema: { type: "string" } },
      { name: "specialty", in: "query", required: false, schema: { type: "string", enum: ["GENERAL", "SURGERY", "DERMATOLOGY", "CARDIOLOGY", "OPHTHALMOLOGY", "NEUROLOGY", "ONCOLOGY", "DENTISTRY", "NUTRITION", "EXOTIC_PETS", "EMERGENCY", "OTHER"] } },
      { name: "isPartner", in: "query", required: false, schema: { type: "string", enum: ["true", "false"] } },
      { name: "isActive", in: "query", required: false, schema: { type: "string", enum: ["true", "false"] } }
    ],
    responses: {
      "200": { description: "Veterinaries list.", content: { "application/json": { schema: okResp("Veterinaries fetched successfully.", { type: "array", items: veterinarySchema }) } } },
      "401": std["401"],
      "500": std["500"]
    }
  },
  "GET /api/v1/veterinaries/{id}": {
    summary: "Get veterinary by id",
    description: "Returns a veterinary listing by id.",
    tags: ["Veterinaries"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Veterinary details.", content: { "application/json": { schema: okResp("Veterinary fetched successfully.", veterinarySchema) } } },
      "401": std["401"],
      "404": std["404"],
      "500": std["500"]
    }
  },
  "PATCH /api/v1/veterinaries/{id}": {
    summary: "Update veterinary",
    description: "Updates a veterinary listing.",
    tags: ["Veterinaries"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    requestBody: {
      required: true,
      description: "Fields to update.",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string", minLength: 2, maxLength: 200 },
              description: { type: ["string", "null"], maxLength: 2000 },
              phone: { type: ["string", "null"], maxLength: 30 },
              email: { type: ["string", "null"], format: "email", maxLength: 160 },
              website: { type: ["string", "null"], format: "uri", maxLength: 300 },
              address: { type: "string", minLength: 3, maxLength: 300 },
              city: { type: "string", minLength: 2, maxLength: 100 },
              lat: { type: ["number", "null"], minimum: -90, maximum: 90 },
              lng: { type: ["number", "null"], minimum: -180, maximum: 180 },
              specialties: { type: "array", items: { type: "string", enum: ["GENERAL", "SURGERY", "DERMATOLOGY", "CARDIOLOGY", "OPHTHALMOLOGY", "NEUROLOGY", "ONCOLOGY", "DENTISTRY", "NUTRITION", "EXOTIC_PETS", "EMERGENCY", "OTHER"] }, minItems: 1 },
              imageUrl: { type: ["string", "null"], format: "uri", maxLength: 500 },
              isPartner: { type: "boolean" },
              isActive: { type: "boolean" },
              operatingHours: { type: ["object", "null"], additionalProperties: true }
            },
            additionalProperties: false
          }
        }
      }
    },
    responses: {
      "200": { description: "Veterinary updated.", content: { "application/json": { schema: okResp("Veterinary updated successfully.", veterinarySchema) } } },
      "400": std["400"],
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "422": std["422"],
      "500": std["500"]
    }
  },
  "DELETE /api/v1/veterinaries/{id}": {
    summary: "Delete veterinary",
    description: "Deletes a veterinary listing.",
    tags: ["Veterinaries"],
    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
    responses: {
      "200": { description: "Veterinary deleted.", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean", example: true }, message: { type: "string", example: "Veterinary deleted successfully." } }, required: ["success", "message"], additionalProperties: false } } } },
      "401": std["401"],
      "403": std["403"],
      "404": std["404"],
      "500": std["500"]
    }
  }
};

export function getMarketplaceOpenApiSpec() {
  return buildOpenApiSpec({
    title: "PetLink Marketplace API",
    description: "OpenAPI documentation for services, bookings, subscriptions, payments, reviews and veterinaries.",
    apiDir: path.join(process.cwd(), "src", "app", "api", "v1"),
    publicOperations: [
      "GET /api/v1",
      "GET /api/v1/health",
      "GET /api/v1/payments/transbank/return",
      "POST /api/v1/payments/transbank/return",
      "POST /api/v1/payments/webhook/{provider}"
    ],
    overrides: marketplaceOverrides
  });
}
