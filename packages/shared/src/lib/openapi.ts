import fs from "node:fs";
import path from "node:path";

const HTTP_METHOD_EXPORTS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] as const;
const JSON_BODY_METHODS = new Set(["post", "put", "patch"]);

type HttpMethodExport = (typeof HTTP_METHOD_EXPORTS)[number];
type HttpMethod = Lowercase<HttpMethodExport>;
type OpenApiObject = Record<string, unknown>;

type OpenApiParameter = {
  name: string;
  in: "path" | "query" | "header";
  required?: boolean;
  description?: string;
  schema?: OpenApiObject;
};

type OpenApiRequestBody = {
  required?: boolean;
  description?: string;
  content: Record<string, OpenApiObject>;
};

type OpenApiResponse = {
  description: string;
  content?: Record<string, OpenApiObject>;
};

export type OpenApiOperationOverride = {
  summary?: string;
  description?: string;
  tags?: string[];
  security?: Array<Record<string, string[]>>;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses?: Record<string, OpenApiResponse>;
};

export type OpenApiOverrides = Record<string, OpenApiOperationOverride>;

export type OpenApiSpecOptions = {
  title: string;
  description: string;
  version?: string;
  apiDir: string;
  routeBasePath?: string;
  publicOperations?: string[];
  overrides?: OpenApiOverrides;
};

type DiscoveredRoute = {
  routePath: string;
  methods: HttpMethod[];
};

const genericSuccessSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", example: true },
    message: { type: "string", example: "Operation completed successfully." },
    data: {
      type: "object",
      additionalProperties: true
    }
  },
  additionalProperties: true
};

const genericErrorSchema = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string", example: "Request could not be processed." },
    errorCode: { type: "string", example: "VALIDATION_ERROR" },
    details: {
      type: "object",
      additionalProperties: true
    }
  },
  additionalProperties: true
};

const collectRouteFiles = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name === "route.ts") {
      files.push(entryPath);
    }
  }

  return files;
};

const toOpenApiPath = (routeFilePath: string, apiDir: string, routeBasePath: string): string => {
  const relative = path.relative(apiDir, routeFilePath);
  const withoutRouteFile = relative.replace(new RegExp(`\\${path.sep}?route\\.ts$`), "");
  const normalized = withoutRouteFile
    .split(path.sep)
    .filter(Boolean)
    .map((segment) => segment.replace(/^\[(.+)\]$/, "{$1}"));

  if (normalized.length === 0) {
    return routeBasePath;
  }

  return `${routeBasePath}/${normalized.join("/")}`;
};

const discoverMethods = (fileContent: string): HttpMethod[] => {
  const methods = new Set<HttpMethod>();
  const matches = fileContent.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g);

  for (const match of matches) {
    const method = match[1];
    if (!method) {
      continue;
    }

    methods.add(method.toLowerCase() as HttpMethod);
  }

  return Array.from(methods);
};

const discoverRoutes = (apiDir: string, routeBasePath: string): DiscoveredRoute[] => {
  return collectRouteFiles(apiDir)
    .map((filePath) => {
      const fileContent = fs.readFileSync(filePath, "utf8");
      return {
        routePath: toOpenApiPath(filePath, apiDir, routeBasePath),
        methods: discoverMethods(fileContent)
      } satisfies DiscoveredRoute;
    })
    .filter((route) => route.methods.length > 0)
    .sort((left, right) => left.routePath.localeCompare(right.routePath));
};

const titleCase = (value: string): string => {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const pathToTag = (routePath: string): string => {
  const segments = routePath.split("/").filter(Boolean);
  const tag = segments[2] ?? "Meta";
  return titleCase(tag.replace(/[{}]/g, ""));
};

const pathParameters = (routePath: string): OpenApiParameter[] => {
  const matches = routePath.match(/\{([^}]+)\}/g) ?? [];
  return matches.map((match) => {
    const name = match.slice(1, -1);
    return {
      name,
      in: "path",
      required: true,
      description: `Route parameter: ${name}`,
      schema: { type: "string" }
    };
  });
};

const defaultSummary = (method: HttpMethod, routePath: string): string => {
  const segments = routePath.split("/").filter(Boolean).slice(2);
  if (segments.length === 0) {
    return `${method.toUpperCase()} API root`;
  }

  const readablePath = segments
    .map((segment) => segment.replace(/[{}]/g, "").replace(/-/g, " "))
    .join(" ");

  return `${method.toUpperCase()} ${titleCase(readablePath)}`;
};

const defaultRequestBody = (method: HttpMethod, routePath: string): OpenApiRequestBody | undefined => {
  if (!JSON_BODY_METHODS.has(method)) {
    return undefined;
  }

  if (routePath.includes("/media/")) {
    return {
      required: true,
      description: "Multipart payload for file upload.",
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              file: {
                type: "string",
                format: "binary"
              }
            },
            required: ["file"]
          }
        }
      }
    };
  }

  return {
    required: true,
    description: "JSON request payload.",
    content: {
      "application/json": {
        schema: {
          type: "object",
          additionalProperties: true
        }
      }
    }
  };
};

const defaultResponses = (method: HttpMethod): Record<string, OpenApiResponse> => {
  const successStatus = method === "post" ? "201" : "200";

  return {
    [successStatus]: {
      description: "Successful response.",
      content: {
        "application/json": {
          schema: genericSuccessSchema
        }
      }
    },
    "400": {
      description: "Bad request.",
      content: {
        "application/json": {
          schema: genericErrorSchema
        }
      }
    },
    "401": {
      description: "Authentication required or invalid token.",
      content: {
        "application/json": {
          schema: genericErrorSchema
        }
      }
    },
    "403": {
      description: "Authenticated user does not have access.",
      content: {
        "application/json": {
          schema: genericErrorSchema
        }
      }
    },
    "404": {
      description: "Requested resource was not found.",
      content: {
        "application/json": {
          schema: genericErrorSchema
        }
      }
    },
    "422": {
      description: "Validation error.",
      content: {
        "application/json": {
          schema: genericErrorSchema
        }
      }
    },
    "500": {
      description: "Internal server error.",
      content: {
        "application/json": {
          schema: genericErrorSchema
        }
      }
    }
  };
};

const mergeParameters = (
  discoveredParameters: OpenApiParameter[],
  overrideParameters: OpenApiParameter[] | undefined
): OpenApiParameter[] | undefined => {
  const merged = [...discoveredParameters];

  for (const parameter of overrideParameters ?? []) {
    if (merged.some((current) => current.in === parameter.in && current.name === parameter.name)) {
      continue;
    }

    merged.push(parameter);
  }

  return merged.length > 0 ? merged : undefined;
};

export function buildOpenApiSpec(options: OpenApiSpecOptions): OpenApiObject {
  const routeBasePath = options.routeBasePath ?? "/api/v1";
  const publicOperations = new Set(options.publicOperations ?? []);
  const overrides = options.overrides ?? {};
  const discoveredRoutes = discoverRoutes(options.apiDir, routeBasePath);
  const paths: Record<string, OpenApiObject> = {};
  const tags = new Set<string>();

  for (const route of discoveredRoutes) {
    const pathItem: OpenApiObject = paths[route.routePath] ?? {};

    for (const method of route.methods) {
      const operationKey = `${method.toUpperCase()} ${route.routePath}`;
      const override = overrides[operationKey];
      const isPublic = publicOperations.has(operationKey);
      const routeTag = override?.tags ?? [pathToTag(route.routePath)];
      routeTag.forEach((tag) => tags.add(tag));

      pathItem[method] = {
        operationId: operationKey
          .replace(/[^a-zA-Z0-9]+/g, "_")
          .replace(/^_+|_+$/g, ""),
        summary: override?.summary ?? defaultSummary(method, route.routePath),
        description: override?.description,
        tags: routeTag,
        security: override?.security ?? (isPublic ? [] : [{ bearerAuth: [] }]),
        parameters: mergeParameters(pathParameters(route.routePath), override?.parameters),
        requestBody: override?.requestBody ?? defaultRequestBody(method, route.routePath),
        responses: override?.responses ?? defaultResponses(method)
      } satisfies OpenApiObject;
    }

    paths[route.routePath] = pathItem;
  }

  return {
    openapi: "3.1.0",
    info: {
      title: options.title,
      description: options.description,
      version: options.version ?? "1.0.0"
    },
    servers: [{ url: "/" }],
    tags: Array.from(tags)
      .sort((left, right) => left.localeCompare(right))
      .map((name) => ({ name })),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        GenericSuccess: genericSuccessSchema,
        GenericError: genericErrorSchema
      }
    },
    paths
  };
}

export function renderSwaggerHtml(title: string, specUrl: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #f8fafc; }
      .topbar { display: none; }
      .swagger-ui .info { margin: 24px 0; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: "#swagger-ui",
        deepLinking: true,
        displayRequestDuration: true,
        persistAuthorization: true,
        tryItOutEnabled: true
      });
    </script>
  </body>
</html>`;
}
