import { renderSwaggerUiHtml } from "@petlink/shared";

export const dynamic = "force-static";

/** Serves the Swagger UI page for the auth API. */
export function GET(): Response {
  const html = renderSwaggerUiHtml({
    title: "PetLink · Auth API — Swagger",
    specUrl: "/api/docs/openapi.json"
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
