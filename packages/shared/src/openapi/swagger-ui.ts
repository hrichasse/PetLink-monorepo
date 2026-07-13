/**
 * Renders a self-contained Swagger UI HTML page that loads the assets from a
 * pinned CDN (unpkg). No npm dependency is added to the app — the browser
 * fetches Swagger UI at runtime and points it at the given OpenAPI spec URL.
 */

/** Pinned so the docs render identically regardless of CDN "latest" changes. */
const SWAGGER_UI_VERSION = "5.17.14";

type SwaggerUiOptions = {
  /** Browser tab title. */
  title: string;
  /** URL (absolute or relative) of the OpenAPI JSON document. */
  specUrl: string;
};

export const renderSwaggerUiHtml = ({ title, specUrl }: SwaggerUiOptions): string => {
  const base = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="${base}/swagger-ui.css" />
    <link rel="icon" href="data:," />
    <style>
      body { margin: 0; background: #fafafa; }
      .topbar { display: none; }
      .swagger-ui .info { margin: 24px 0; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${base}/swagger-ui-bundle.js" crossorigin></script>
    <script src="${base}/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: ${JSON.stringify(specUrl)},
        dom_id: "#swagger-ui",
        deepLinking: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 0,
        tryItOutEnabled: true,
        persistAuthorization: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout"
      });
    </script>
  </body>
</html>`;
};
