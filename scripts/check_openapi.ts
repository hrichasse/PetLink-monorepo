import { getMarketplaceOpenApiSpec } from "../apps/marketplace/src/lib/openapi";
import { getPetsOpenApiSpec } from "../apps/pets/src/lib/openapi";
import { getAuthOpenApiSpec } from "../apps/auth/src/lib/openapi";

function checkSpec(name: string, spec: any) {
  console.log(`\n=== Checking ${name} ===`);
  const paths = spec.paths || {};
  let missingOverrides = 0;
  for (const [pathStr, pathItem] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathItem as any)) {
      const op = operation as any;
      if (!op.description || op.summary.startsWith(method.toUpperCase() + " ")) {
        console.log(`Missing or default override for: ${method.toUpperCase()} ${pathStr}`);
        missingOverrides++;
      }
    }
  }
  if (missingOverrides === 0) {
    console.log("All operations have custom overrides.");
  }
}

try {
  checkSpec("Marketplace", getMarketplaceOpenApiSpec());
  checkSpec("Pets", getPetsOpenApiSpec());
  checkSpec("Auth", getAuthOpenApiSpec());
} catch (error) {
  console.error("Error generating specs:", error);
}
